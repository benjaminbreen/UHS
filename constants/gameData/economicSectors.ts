/**
 * constants/gameData/economicSectors.ts - Economic sectors by era and region
 */
import { HistoricalEra } from '../../types';

export enum EconomicSector {
    AGRICULTURAL = 'agricultural',
    INDUSTRIAL = 'industrial',
    SERVICE = 'service',
    RESOURCE_EXTRACTION = 'resource_extraction',
    MIXED = 'mixed'
}

export interface IndustryData {
    name: string;
    sector: EconomicSector;
    description: string;
    products?: string[];
    requiredResources?: string[];
    typicalJobs: string[];
}

// Industries by era and type
export const INDUSTRIAL_ERA_INDUSTRIES: IndustryData[] = [
    // Heavy Industry
    { 
        name: 'Steel Production',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Foundries and mills producing steel for construction and manufacturing',
        products: ['steel beams', 'rails', 'sheet metal'],
        requiredResources: ['iron ore', 'coal'],
        typicalJobs: ['steelworker', 'foundryman', 'mill operator', 'forge worker']
    },
    {
        name: 'Textile Manufacturing',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Mills and factories producing cloth and garments',
        products: ['cotton cloth', 'wool fabric', 'garments'],
        requiredResources: ['cotton', 'wool', 'dyes'],
        typicalJobs: ['weaver', 'spinner', 'dyer', 'seamstress', 'mill worker']
    },
    {
        name: 'Coal Mining',
        sector: EconomicSector.RESOURCE_EXTRACTION,
        description: 'Extraction of coal for fuel and industrial processes',
        products: ['coal', 'coke'],
        typicalJobs: ['miner', 'pit supervisor', 'hauler', 'breaker boy']
    },
    {
        name: 'Railway Equipment',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Manufacturing of locomotives and railway cars',
        products: ['locomotives', 'freight cars', 'passenger cars'],
        requiredResources: ['steel', 'wood', 'brass'],
        typicalJobs: ['engineer', 'machinist', 'boilermaker', 'assembly worker']
    },
    {
        name: 'Shipbuilding',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Construction of steamships and sailing vessels',
        products: ['cargo ships', 'passenger steamers', 'naval vessels'],
        requiredResources: ['steel', 'wood', 'canvas'],
        typicalJobs: ['shipwright', 'riveter', 'caulker', 'sail maker']
    }
];

export const MODERN_ERA_INDUSTRIES: IndustryData[] = [
    // 20th Century Industries
    {
        name: 'Automobile Manufacturing',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Mass production of automobiles and trucks',
        products: ['passenger cars', 'trucks', 'buses'],
        requiredResources: ['steel', 'rubber', 'glass', 'petroleum'],
        typicalJobs: ['assembly line worker', 'mechanic', 'quality inspector', 'tool maker']
    },
    {
        name: 'Electronics Manufacturing',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Production of radios, televisions, and electronic components',
        products: ['radios', 'televisions', 'transistors', 'circuit boards'],
        requiredResources: ['copper', 'silicon', 'plastics'],
        typicalJobs: ['electronics assembler', 'technician', 'quality control', 'engineer']
    },
    {
        name: 'Chemical Production',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Manufacturing of industrial chemicals and plastics',
        products: ['fertilizers', 'plastics', 'pharmaceuticals', 'synthetic materials'],
        requiredResources: ['petroleum', 'natural gas', 'minerals'],
        typicalJobs: ['chemical operator', 'lab technician', 'process engineer', 'safety inspector']
    },
    {
        name: 'Weapons Manufacturing',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Production of military equipment and munitions',
        products: ['rifles', 'artillery', 'ammunition', 'military vehicles'],
        requiredResources: ['steel', 'explosives', 'electronics'],
        typicalJobs: ['munitions worker', 'armorer', 'ballistics technician', 'assembly specialist']
    },
    {
        name: 'Aircraft Manufacturing',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Production of civilian and military aircraft',
        products: ['fighter jets', 'passenger planes', 'helicopters'],
        requiredResources: ['aluminum', 'titanium', 'composites'],
        typicalJobs: ['aerospace engineer', 'riveter', 'avionics technician', 'test pilot']
    },
    {
        name: 'Oil Refining',
        sector: EconomicSector.RESOURCE_EXTRACTION,
        description: 'Processing crude oil into fuels and petrochemicals',
        products: ['gasoline', 'diesel', 'jet fuel', 'plastics'],
        requiredResources: ['crude oil'],
        typicalJobs: ['refinery operator', 'petroleum engineer', 'pipeline worker', 'chemist']
    }
];

export const COLD_WAR_INDUSTRIES: IndustryData[] = [
    // Eastern Bloc specific
    {
        name: 'Tractor Factory',
        sector: EconomicSector.INDUSTRIAL,
        description: 'State-run factory producing agricultural machinery',
        products: ['tractors', 'combines', 'agricultural equipment'],
        requiredResources: ['steel', 'rubber', 'fuel'],
        typicalJobs: ['factory worker', 'mechanic', 'party supervisor', 'quality inspector']
    },
    {
        name: 'State Electronics Plant',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Government facility producing consumer electronics and military equipment',
        products: ['radios', 'radar systems', 'electronic components'],
        requiredResources: ['rare metals', 'silicon', 'copper'],
        typicalJobs: ['technician', 'assembly worker', 'engineer', 'security officer']
    },
    {
        name: 'Heavy Machinery Kombinat',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Industrial complex producing mining and construction equipment',
        products: ['excavators', 'cranes', 'mining equipment'],
        requiredResources: ['steel', 'hydraulics', 'engines'],
        typicalJobs: ['welder', 'machinist', 'hydraulics specialist', 'crane operator']
    }
];

export const SERVICE_INDUSTRIES: IndustryData[] = [
    // Service sector
    {
        name: 'Banking and Finance',
        sector: EconomicSector.SERVICE,
        description: 'Financial services and investment management',
        typicalJobs: ['banker', 'teller', 'accountant', 'loan officer', 'investment analyst']
    },
    {
        name: 'Telecommunications',
        sector: EconomicSector.SERVICE,
        description: 'Telephone and telegraph services',
        typicalJobs: ['telephone operator', 'lineman', 'telegraph operator', 'switchboard operator']
    },
    {
        name: 'Transportation Services',
        sector: EconomicSector.SERVICE,
        description: 'Railways, shipping, and trucking services',
        typicalJobs: ['train conductor', 'truck driver', 'dispatcher', 'porter', 'shipping clerk']
    },
    {
        name: 'Retail Trade',
        sector: EconomicSector.SERVICE,
        description: 'Department stores and retail establishments',
        typicalJobs: ['shop clerk', 'cashier', 'floor manager', 'window dresser', 'buyer']
    },
    {
        name: 'Healthcare',
        sector: EconomicSector.SERVICE,
        description: 'Hospitals and medical services',
        typicalJobs: ['doctor', 'nurse', 'orderly', 'pharmacist', 'lab technician']
    },
    {
        name: 'Education',
        sector: EconomicSector.SERVICE,
        description: 'Schools and universities',
        typicalJobs: ['teacher', 'professor', 'administrator', 'librarian', 'janitor']
    }
];

export const FUTURE_ERA_INDUSTRIES: IndustryData[] = [
    {
        name: 'Quantum Computing',
        sector: EconomicSector.SERVICE,
        description: 'Development of quantum processors and algorithms',
        products: ['quantum processors', 'encryption systems'],
        typicalJobs: ['quantum engineer', 'algorithm designer', 'cryogenics specialist']
    },
    {
        name: 'Biotechnology',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Genetic engineering and synthetic biology',
        products: ['gene therapies', 'synthetic organisms', 'bio-materials'],
        typicalJobs: ['genetic engineer', 'bio-informatician', 'lab technician']
    },
    {
        name: 'Space Industry',
        sector: EconomicSector.INDUSTRIAL,
        description: 'Spacecraft manufacturing and orbital services',
        products: ['satellites', 'space stations', 'mining equipment'],
        typicalJobs: ['aerospace engineer', 'mission specialist', 'orbital welder']
    },
    {
        name: 'AI Development',
        sector: EconomicSector.SERVICE,
        description: 'Artificial intelligence and machine learning services',
        products: ['AI models', 'autonomous systems', 'neural networks'],
        typicalJobs: ['AI researcher', 'data scientist', 'ethics consultant']
    },
    {
        name: 'Renewable Energy',
        sector: EconomicSector.RESOURCE_EXTRACTION,
        description: 'Solar, wind, and fusion power generation',
        products: ['clean electricity', 'hydrogen fuel'],
        typicalJobs: ['solar technician', 'wind turbine engineer', 'fusion reactor operator']
    },
    {
        name: 'Call Centers',
        sector: EconomicSector.SERVICE,
        description: 'Customer service and technical support operations',
        typicalJobs: ['call center agent', 'supervisor', 'quality analyst', 'IT support']
    },
    {
        name: 'Data Centers',
        sector: EconomicSector.SERVICE,
        description: 'Cloud computing and data storage facilities',
        typicalJobs: ['systems administrator', 'network engineer', 'security analyst', 'data center technician']
    }
];

// Helper function to get dominant economic sector by era and region
export function getDominantSector(era: HistoricalEra, region: string): EconomicSector {
    // Industrial regions in industrial/modern eras
    const industrialRegions = [
        'Germanic Lands', 'British Isles', 'Rhine Valley', 'Ruhr Valley',
        'Great Lakes', 'New England', 'Carpathian Foothills', 'Silesia',
        'Bohemia', 'Northern Italy', 'Catalonia', 'Urals', 'Donbass'
    ];
    
    // Service-oriented regions in modern era
    const serviceRegions = [
        'London Basin', 'Paris Basin', 'New York', 'Tokyo', 'Hong Kong',
        'Singapore', 'Swiss Alps', 'Luxembourg', 'Manhattan'
    ];
    
    // Resource extraction regions
    const resourceRegions = [
        'Texas Hill Country', 'Arabian Peninsula', 'Persian Gulf', 'Siberia',
        'Alaska', 'Venezuela', 'Nigeria Delta', 'North Sea', 'Pilbara',
        'Appalachian Mountains', 'Ruhr Valley', 'Donbass'
    ];
    
    // Determine by era
    if (era === HistoricalEra.ANTIQUITY || era === HistoricalEra.MEDIEVAL) {
        return EconomicSector.AGRICULTURAL;
    }
    
    if (era === HistoricalEra.RENAISSANCE_EARLY_MODERN) {
        return industrialRegions.includes(region) ? EconomicSector.MIXED : EconomicSector.AGRICULTURAL;
    }
    
    if (era === HistoricalEra.INDUSTRIAL_ERA) {
        if (industrialRegions.includes(region)) return EconomicSector.INDUSTRIAL;
        if (resourceRegions.includes(region)) return EconomicSector.RESOURCE_EXTRACTION;
        return EconomicSector.AGRICULTURAL;
    }
    
    if (era === HistoricalEra.MODERN_ERA) {
        if (serviceRegions.includes(region)) return EconomicSector.SERVICE;
        if (industrialRegions.includes(region)) return EconomicSector.INDUSTRIAL;
        if (resourceRegions.includes(region)) return EconomicSector.RESOURCE_EXTRACTION;
        return EconomicSector.MIXED;
    }
    
    if (era === HistoricalEra.FUTURE_ERA) {
        if (serviceRegions.includes(region)) return EconomicSector.SERVICE;
        return EconomicSector.MIXED;
    }
    
    return EconomicSector.AGRICULTURAL;
}

// Get appropriate industries for a region and era
export function getRegionalIndustries(era: HistoricalEra, region: string): IndustryData[] {
    const sector = getDominantSector(era, region);
    
    let availableIndustries: IndustryData[] = [];
    
    // Add era-appropriate industries
    if (era === HistoricalEra.INDUSTRIAL_ERA) {
        availableIndustries = [...INDUSTRIAL_ERA_INDUSTRIES];
    } else if (era === HistoricalEra.MODERN_ERA) {
        availableIndustries = [...MODERN_ERA_INDUSTRIES];
        
        // Add Cold War industries for Eastern Europe in 1945-1990
        if (region.includes('Carpathian') || region.includes('Eastern Europe') || 
            region.includes('Poland') || region.includes('Bohemia')) {
            availableIndustries.push(...COLD_WAR_INDUSTRIES);
        }
        
        availableIndustries.push(...SERVICE_INDUSTRIES);
    } else if (era === HistoricalEra.FUTURE_ERA) {
        availableIndustries = [...FUTURE_ERA_INDUSTRIES, ...SERVICE_INDUSTRIES];
    }
    
    // Filter by sector if needed
    if (sector === EconomicSector.INDUSTRIAL) {
        return availableIndustries.filter(i => i.sector === EconomicSector.INDUSTRIAL);
    } else if (sector === EconomicSector.SERVICE) {
        return availableIndustries.filter(i => i.sector === EconomicSector.SERVICE);
    }
    
    return availableIndustries;
}

// Get a random primary industry for a region
export function getPrimaryIndustry(era: HistoricalEra, region: string): IndustryData | null {
    const industries = getRegionalIndustries(era, region);
    if (industries.length === 0) return null;
    
    // Weight selection based on regional characteristics
    return industries[Math.floor(Math.random() * industries.length)];
}