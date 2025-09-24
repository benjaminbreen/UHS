/**
 * services/imageGenerationService.ts - AI image generation service using Runware API
 * Cost-effective image generation for game items at $0.0006 per image
 */
import { Runware } from '@runware/sdk-js';
import { Item, PlayerCharacter, CulturalZone } from '../types';
import { QuestNPC } from './worldWeaverService';

interface ImageGenerationContext {
  item: Item;
  culturalZone?: CulturalZone;
  year?: number;
  playerProfession?: string;
}

interface NPCPortraitContext {
  npc: QuestNPC;
  culturalZone: CulturalZone;
  era: string;
  location: string;
}

interface CachedImage {
  url: string;
  timestamp: number;
  prompt: string;
}

class ImageGenerationService {
  private runware: Runware | null = null;
  private lastRequestTime = 0;
  private readonly MIN_INTERVAL = 60000; // 1 minute rate limit
  private readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly DB_NAME = 'ItemImageCache';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'images';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initializeDB();
    this.initializeRunware();
  }

  private initializeRunware() {
    // In browser environment, we need to use import.meta.env for Vite
    const apiKey = (import.meta as any).env?.VITE_RUNWARE_API_KEY;

    if (!apiKey) {
      console.warn('Runware API key not found. Set VITE_RUNWARE_API_KEY in .env.local');
      return;
    }

    try {
      this.runware = new Runware({ apiKey });
      console.log('Runware initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Runware:', error);
    }
  }

  private async initializeDB() {
    if (!window.indexedDB) {
      console.warn('IndexedDB not supported. Image caching will be disabled.');
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const request = window.indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME, { keyPath: 'cacheKey' });
        }
      };
    });
  }

  /**
   * Generates a cache key for an item based on context
   */
  private getCacheKey(item: Item, context: ImageGenerationContext): string {
    const culturalZone = context.culturalZone || 'UNKNOWN';
    const century = context.year ? Math.floor(context.year / 100) : 0;
    return `${item.baseId}-${culturalZone}-${century}`;
  }

  /**
   * Builds a historically accurate prompt for image generation
   */
  private buildPrompt(item: Item, context: ImageGenerationContext): string {
    const { culturalZone, year, playerProfession } = context;

    // Start with detailed physical description
    let prompt = `A detailed, photorealistic ${item.name}`;

    // Add material with texture details
    if (item.material) {
      const materialDescriptions: Record<string, string> = {
        'steel': 'polished steel with visible grain patterns',
        'iron': 'dark iron with forge marks',
        'bronze': 'patinated bronze with greenish oxidation',
        'wood': 'aged wood with visible grain',
        'silk': 'lustrous silk fabric',
        'wool': 'coarse woolen textile',
        'leather': 'worn leather with natural patina',
        'stone': 'rough hewn stone',
        'bone': 'yellowed bone material',
        'gold': 'gleaming gold metal',
        'silver': 'tarnished silver'
      };
      const materialDesc = materialDescriptions[item.material.toLowerCase()] || item.material;
      prompt = `A detailed ${materialDesc} ${item.name}`;
    }

    // Add quality with visual details
    if (item.quality === 'excellent') {
      prompt += ', masterfully crafted, pristine condition, intricate decorations';
    } else if (item.quality === 'good') {
      prompt += ', well-made, good condition, some wear from use';
    } else if (item.quality === 'poor') {
      prompt += ', worn and weathered, visible damage, patina of age';
    }

    // Add rich cultural and period styling
    const culturalStyles: Record<string, string> = {
      'EUROPEAN': 'European medieval craftsmanship with Gothic decorative elements',
      'EAST_ASIAN': 'East Asian design with traditional motifs and calligraphy',
      'MENA': 'Islamic geometric patterns and Arabic calligraphy decorations',
      'NORTH_AMERICAN_PRE_COLUMBIAN': 'Pre-Columbian motifs with geometric patterns',
      'OCEANIA': 'Polynesian carved patterns and natural materials',
      'SOUTH_ASIAN': 'South Asian ornamental design with intricate engravings',
      'SOUTH_AMERICAN': 'Incan or Amazonian indigenous patterns',
      'SUB_SAHARAN_AFRICAN': 'African tribal patterns and carved decorations'
    };

    if (culturalZone && culturalStyles[culturalZone]) {
      prompt += `, ${culturalStyles[culturalZone]}`;
    }

    // Add specific time period details
    if (year) {
      if (year < 500) prompt += ', ancient artifact with archaeological wear';
      else if (year < 1500) prompt += `, ${year} CE historical artifact`;
      else if (year < 1800) prompt += ', early modern period craftsmanship';
      else if (year < 1950) prompt += ', industrial age manufacture';
      else prompt += ', contemporary craft';
    }

    // Add rich category-specific details
    if (item.type === 'Weapon' || item.name.toLowerCase().includes('sword')) {
      prompt += ', detailed blade with fuller, crossguard, pommel, leather-wrapped grip, sharp edge catching light';
    } else if (item.type === 'Clothing') {
      prompt += ', detailed textile weave visible, natural dyes, period-appropriate cut and style';
    } else if (item.type === 'Food') {
      prompt += ', fresh ingredients, steam rising, appetizing presentation on period dishware';
    } else if (item.type === 'Tool') {
      prompt += ', functional design, wear marks from use, utilitarian construction';
    }

    // Enhanced final styling for museum quality
    prompt += ', professional museum photography, dramatic lighting, sharp focus, high detail, 4K quality, studio photograph against neutral gray background, National Geographic style, archaeological documentation photograph';

    return prompt;
  }

  /**
   * Retrieves cached image from IndexedDB
   */
  private async getCachedImage(cacheKey: string): Promise<CachedImage | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.get(cacheKey);

        request.onsuccess = () => {
          const cached = request.result;
          if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
            resolve(cached);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.error('Failed to retrieve cached image:', request.error);
          resolve(null);
        };
      } catch (error) {
        console.error('Cache retrieval error:', error);
        resolve(null);
      }
    });
  }

  /**
   * Stores generated image in IndexedDB cache
   */
  private async cacheImage(cacheKey: string, image: CachedImage): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        const request = store.put({ cacheKey, ...image });

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Failed to cache image:', request.error);
          resolve();
        };
      } catch (error) {
        console.error('Cache storage error:', error);
        resolve();
      }
    });
  }

  /**
   * Main method to generate or retrieve an item image
   * Returns object with imageUrl and the prompt used
   */
  async generateItemImage(context: ImageGenerationContext): Promise<{ imageUrl: string | null, prompt?: string }> {
    const { item } = context;

    // Check cache first
    const cacheKey = this.getCacheKey(item, context);
    const cached = await this.getCachedImage(cacheKey);

    if (cached) {
      console.log('Using cached image for:', item.name);
      return { imageUrl: cached.url, prompt: cached.prompt };
    }

    // Check if Runware is initialized
    if (!this.runware) {
      console.warn('Runware not initialized. Cannot generate image.');
      return { imageUrl: null };
    }

    // Enforce rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_INTERVAL) {
      const waitTime = this.MIN_INTERVAL - timeSinceLastRequest;
      const seconds = Math.ceil(waitTime / 1000);
      throw new Error(`Rate limited. Please wait ${seconds} seconds before generating another image.`);
    }

    try {
      this.lastRequestTime = now;
      const prompt = this.buildPrompt(item, context);

      console.log('Generating image with prompt:', prompt);

      // Generate image using Runware with higher quality settings
      const images = await this.runware.requestImages({
        positivePrompt: prompt,
        negativePrompt: 'modern, plastic, synthetic, digital art, cartoon, anime, blurry, watermark, text, low quality, abstract, minimalist',
        model: 'runware:101@1', // Fast, general purpose model
        width: 512,
        height: 512,
        numberResults: 1,
        outputType: 'URL',
        outputFormat: 'WEBP',
        steps: 20, // Higher steps for better quality (was 4)
        CFGScale: 7.5, // Add guidance scale for better prompt adherence
        scheduler: 'DPMSolverMultistepScheduler' // Better scheduler for quality
      });

      if (images && images.length > 0 && images[0].imageURL) {
        const imageUrl = images[0].imageURL;

        // Cache the generated image
        await this.cacheImage(cacheKey, {
          url: imageUrl,
          timestamp: Date.now(),
          prompt
        });

        console.log('Image generated successfully for:', item.name);
        return { imageUrl, prompt };
      } else {
        console.error('No image generated');
        return { imageUrl: null, prompt };
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
      throw error;
    }
  }

  /**
   * Checks if image generation is available
   */
  isAvailable(): boolean {
    return this.runware !== null;
  }

  /**
   * Gets the time until next image can be generated (in seconds)
   */
  getTimeUntilNextGeneration(): number {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    const waitTime = Math.max(0, this.MIN_INTERVAL - timeSinceLastRequest);
    return Math.ceil(waitTime / 1000);
  }

  /**
   * Generates an AI portrait for a WorldWeaver quest NPC
   */
  async generateQuestNPCPortrait(context: NPCPortraitContext): Promise<{ imageUrl: string | null; prompt: string }> {
    const { npc, culturalZone, era, location } = context;

    // Build cache key for NPC portraits
    const cacheKey = `npc-${npc.id}-${culturalZone}-${era}`;

    // Check cache first
    const cached = await this.getCachedImage(cacheKey);
    if (cached) {
      console.log(`[ImageGen] Using cached portrait for ${npc.name}`);
      return { imageUrl: cached.url, prompt: cached.prompt };
    }

    if (!this.runware) {
      console.warn('[ImageGen] Runware not available for NPC portrait generation');
      return { imageUrl: null, prompt: this.buildNPCPrompt(context) };
    }

    const prompt = this.buildNPCPrompt(context);

    try {
      console.log(`[ImageGen] Generating portrait for ${npc.name}:`, prompt);

      const images = await this.runware.requestImages({
        positivePrompt: prompt,
        negativePrompt: 'modern clothing, sunglasses, modern hairstyles, plastic, synthetic, digital art, cartoon, anime, blurry, watermark, text, low quality, abstract, minimalist, multiple people, crowd',
        model: 'runware:101@1', // Fast, general purpose model
        width: 512,
        height: 512,
        numberResults: 1,
        outputType: 'URL',
        outputFormat: 'WEBP',
        steps: 25, // Higher quality for portraits
        CFGScale: 8.0, // Strong prompt adherence for character details
      });

      this.lastRequestTime = Date.now();

      if (images && images.length > 0) {
        const imageUrl = images[0].imageURL;

        // Cache the generated portrait
        await this.cacheImage(cacheKey, imageUrl, prompt);

        console.log(`[ImageGen] Generated portrait for ${npc.name}:`, imageUrl);
        return { imageUrl, prompt };
      } else {
        console.warn(`[ImageGen] No images returned for ${npc.name}`);
        return { imageUrl: null, prompt };
      }
    } catch (error) {
      console.error(`[ImageGen] Failed to generate portrait for ${npc.name}:`, error);
      return { imageUrl: null, prompt };
    }
  }

  /**
   * Builds a historically accurate portrait prompt for an NPC
   */
  private buildNPCPrompt(context: NPCPortraitContext): string {
    const { npc, culturalZone, era, location } = context;

    // Start with basic portrait description
    let prompt = `Professional portrait of ${npc.name}, a ${npc.profession || npc.role}`;

    // Add physical appearance if provided
    if (npc.appearance) {
      prompt += `, ${npc.appearance}`;
    } else {
      // Generate basic appearance based on role and culture
      prompt += this.generateAppearanceFromRole(npc.role, culturalZone);
    }

    // Add cultural and era-specific details
    prompt += this.getCulturalPortraitDetails(culturalZone, era);

    // Add location context
    prompt += `, photographed in ${location}`;

    // Add art style direction
    prompt += ', Renaissance painting style, oil painting, classical portrait, detailed facial features, dignified pose, soft lighting, muted colors, historical accuracy';

    // Add personality traits if available
    if (npc.personality) {
      const personalityTraits = this.convertPersonalityToVisual(npc.personality);
      if (personalityTraits) {
        prompt += `, ${personalityTraits}`;
      }
    }

    return prompt;
  }

  /**
   * Generate appearance description based on role and culture
   */
  private generateAppearanceFromRole(role: string, culturalZone: CulturalZone): string {
    const roleLower = role.toLowerCase();

    // Age and build based on role
    let description = '';

    if (roleLower.includes('farmer') || roleLower.includes('peasant')) {
      description += ', weathered face, callused hands, sturdy build';
    } else if (roleLower.includes('merchant') || roleLower.includes('trader')) {
      description += ', well-fed appearance, shrewd eyes, confident bearing';
    } else if (roleLower.includes('noble') || roleLower.includes('lord')) {
      description += ', refined features, elegant bearing, well-groomed';
    } else if (roleLower.includes('brigand') || roleLower.includes('bandit')) {
      description += ', scarred face, rugged appearance, fierce eyes';
    } else if (roleLower.includes('priest') || roleLower.includes('monk')) {
      description += ', serene expression, kind eyes, humble bearing';
    } else {
      description += ', honest face, average build';
    }

    return description;
  }

  /**
   * Get cultural and era-specific portrait details
   */
  private getCulturalPortraitDetails(culturalZone: CulturalZone, era: string): string {
    let details = '';

    // Era-specific clothing and style
    switch (era) {
      case 'MEDIEVAL':
        details += ', medieval clothing, simple fabrics, earth tones';
        break;
      case 'RENAISSANCE_EARLY_MODERN':
        details += ', Renaissance clothing, rich fabrics, detailed embroidery';
        break;
      case 'ANTIQUITY':
        details += ', ancient robes, classical drapery, simple jewelry';
        break;
      case 'INDUSTRIAL_ERA':
        details += ', period clothing, formal attire, structured garments';
        break;
      default:
        details += ', period-appropriate clothing';
    }

    // Cultural features
    switch (culturalZone) {
      case 'EUROPEAN':
        details += ', European features, fair to olive skin';
        break;
      case 'EAST_ASIAN':
        details += ', East Asian features, traditional hairstyles';
        break;
      case 'SUB_SAHARAN_AFRICAN':
        details += ', African features, dark skin, traditional styling';
        break;
      case 'MENA':
        details += ', Middle Eastern features, Mediterranean appearance';
        break;
      case 'SOUTH_ASIAN':
        details += ', South Asian features, traditional dress elements';
        break;
      case 'OCEANIA':
        details += ', Polynesian features, island cultural elements';
        break;
      case 'NORTH_AMERICAN_PRE_COLUMBIAN':
        details += ', Native American features, traditional styling';
        break;
      default:
        details += ', culturally authentic features';
    }

    return details;
  }

  /**
   * Convert personality traits to visual descriptors
   */
  private convertPersonalityToVisual(personality: string): string {
    const personalityLower = personality.toLowerCase();
    let traits: string[] = [];

    if (personalityLower.includes('anxious') || personalityLower.includes('worried')) {
      traits.push('worried expression');
    }
    if (personalityLower.includes('wise') || personalityLower.includes('intelligent')) {
      traits.push('intelligent eyes');
    }
    if (personalityLower.includes('kind') || personalityLower.includes('gentle')) {
      traits.push('kind expression');
    }
    if (personalityLower.includes('stern') || personalityLower.includes('serious')) {
      traits.push('stern countenance');
    }
    if (personalityLower.includes('friendly') || personalityLower.includes('welcoming')) {
      traits.push('warm smile');
    }
    if (personalityLower.includes('suspicious') || personalityLower.includes('wary')) {
      traits.push('cautious gaze');
    }

    return traits.length > 0 ? traits.join(', ') : '';
  }

  /**
   * Generates a photorealistic city scene based on historical context
   */
  async generateCitySceneImage(context: {
    cityName: string;
    llmDescription: string;
    culturalZone: CulturalZone;
    year: number;
    timeOfDay: string;
    dateStr: string;
  }): Promise<{ imageUrl: string | null; prompt: string }> {
    // Build cache key for city scenes
    const cacheKey = `city-${context.cityName}-${context.culturalZone}-${Math.floor(context.year / 100)}-${context.timeOfDay}`;

    // Check cache first
    const cached = await this.getCachedImage(cacheKey);
    if (cached) {
      console.log(`Using cached city scene for ${context.cityName}`);
      return { imageUrl: cached.url, prompt: cached.prompt };
    }

    if (!this.runware) {
      console.warn('Runware not available for city scene generation');
      return { imageUrl: null, prompt: '' };
    }

    // Build the highly detailed prompt
    const prompt = this.buildCityScenePrompt(context);

    // Enforce rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.MIN_INTERVAL) {
      const waitTime = this.MIN_INTERVAL - timeSinceLastRequest;
      const seconds = Math.ceil(waitTime / 1000);
      throw new Error(`Rate limited. Please wait ${seconds} seconds before generating another image.`);
    }

    try {
      this.lastRequestTime = now;

      console.log(`[ImageGen] Generating city scene for ${context.cityName}:`, prompt);

      const images = await this.runware.requestImages({
        positivePrompt: prompt,
        negativePrompt: '',
        model: 'runware:101@1',
        width: 768,  // Wider for city scenes
        height: 512,
        numberResults: 1,
        outputType: 'URL',
        outputFormat: 'WEBP',
        steps: 40,  // Higher quality for city scenes
        CFGScale: 9.5,  // Strong adherence to prompt
        scheduler: 'DPMSolverMultistepScheduler'
      });

      if (images && images.length > 0 && images[0].imageURL) {
        const imageUrl = images[0].imageURL;

        // Cache the generated image
        await this.cacheImage(cacheKey, {
          url: imageUrl,
          timestamp: Date.now(),
          prompt
        });

        console.log(`City scene generated successfully for ${context.cityName}`);
        return { imageUrl, prompt };
      } else {
        console.error('No city image generated');
        return { imageUrl: null, prompt };
      }
    } catch (error) {
      console.error('Failed to generate city scene:', error);
      throw error;
    }
  }

  /**
   * Builds a detailed prompt for city scene generation
   */
  private buildCityScenePrompt(context: {
    cityName: string;
    llmDescription: string;
    culturalZone: CulturalZone;
    year: number;
    timeOfDay: string;
    dateStr: string;
  }): string {
    // Extract key visual elements from the LLM description
    const descriptionKeywords = this.extractVisualKeywords(context.llmDescription);

    // Cultural and architectural styles
    const architecturalStyles: Record<string, string> = {
      'EUROPEAN': context.year < 500 ? 'Roman stone architecture with columns and arches' :
                  context.year < 1000 ? 'Early medieval timber and stone buildings with thatched roofs' :
                  context.year < 1500 ? 'Gothic stone architecture with pointed arches and narrow streets' :
                  'Renaissance architecture with symmetrical facades and domed buildings',
      'EAST_ASIAN': context.year < 500 ? 'Ancient Chinese wooden architecture with curved tile roofs' :
                    context.year < 1000 ? 'Tang dynasty pagodas and traditional courtyard houses' :
                    context.year < 1500 ? 'Song/Yuan dynasty buildings with upturned eaves' :
                    'Ming dynasty architecture with elaborate decorations',
      'MENA': context.year < 700 ? 'Byzantine/Sassanid stone architecture with domes' :
              context.year < 1500 ? 'Islamic architecture with horseshoe arches, minarets, geometric patterns' :
              'Ottoman architecture with large domes and slender minarets',
      'SUB_SAHARAN_AFRICAN': 'Traditional mud-brick architecture with organic shapes and wooden supports',
      'SOUTH_ASIAN': context.year < 500 ? 'Ancient Indian stone temples with intricate carvings' :
                     context.year < 1500 ? 'Medieval Indian architecture with stepped temples' :
                     'Mughal architecture with onion domes and decorative arches',
      'NORTH_AMERICAN_PRE_COLUMBIAN': 'Indigenous architecture with adobe, stone, or wooden structures',
      'NORTH_AMERICAN_COLONIAL': 'Colonial wooden buildings with shutters and pitched roofs',
      'OCEANIA': 'Traditional Polynesian structures with thatched roofs and natural materials',
      'SOUTH_AMERICAN': context.year < 1500 ? 'Pre-Columbian stone architecture with precise masonry' :
                        'Colonial Spanish architecture with courtyards and balconies'
    };

    const style = architecturalStyles[context.culturalZone] || 'historical period-appropriate architecture';

    // Time of day lighting
    const lightingDescriptions: Record<string, string> = {
      'dawn': 'dawn light',
      'morning': 'morning light',
      'noon': 'noon light',
      'afternoon': ' afternoon light',
      'evening': 'sunset light',
      'night': 'moonlit scene '
    };

    const lighting = lightingDescriptions[context.timeOfDay] || 'natural daylight';

    // Start with the actual LLM description as the primary content
    let prompt = `${context.llmDescription} `;

    // Add just the essential context
    prompt += `IMPORTANT: THE IMAGE MUST BE ACCURATE TO THIS DATE: ${context.cityName}, ${Math.abs(context.year)} ${context.year < 0 ? 'BCE' : 'CE'}. `;

    // Add the lighting for this time of day
    prompt += `${lighting}. `;

    // Simple quality and style markers
    prompt += 'Strictly realistic historical scene, accurate period details, street-level view, high resolution pixel art, no awnings, ';
    prompt += 'detailed, natural colors, clear details, high quality';

    return prompt;
  }

  /**
   * Extracts visual keywords from LLM description
   */
  private extractVisualKeywords(description: string): string[] {
    const keywords: string[] = [];
    const lowerDesc = description.toLowerCase();

    // Look for architectural features
    const architecturalTerms = [
      'tower', 'dome', 'arch', 'column', 'spire', 'wall', 'gate', 'bridge',
      'temple', 'palace', 'market', 'bazaar', 'forum', 'cathedral', 'church',
      'timber-framed', 'half-timbered', 'jutting', 'overhanging', 'cobbled',
      'narrow', 'winding', 'alley', 'lane'
    ];
    architecturalTerms.forEach(term => {
      if (lowerDesc.includes(term)) {
        // Don't add redundant "s visible" for descriptive terms
        if (term.includes('-') || term === 'narrow' || term === 'winding' || term === 'jutting' || term === 'overhanging') {
          keywords.push(term);
        } else {
          keywords.push(term);
        }
      }
    });

    // Look for specific architectural descriptions
    if (lowerDesc.includes('timber-framed') || lowerDesc.includes('timber framed')) {
      keywords.push('timber-framed buildings with visible beams');
    }
    if (lowerDesc.includes('upper stories jutting') || lowerDesc.includes('upper floors')) {
      keywords.push('overhanging upper floors');
    }
    if (lowerDesc.includes('cobbled') || lowerDesc.includes('cobblestone')) {
      keywords.push('cobblestone streets');
    }

    // Look for material references with better context
    const materials = [
      'stone', 'marble', 'wood', 'timber', 'brick', 'mud', 'clay',
      'bronze', 'iron', 'thatch', 'tile', 'slate', 'plaster', 'wattle'
    ];
    materials.forEach(material => {
      if (lowerDesc.includes(material)) {
        keywords.push(`${material} visible`);
      }
    });

    // Look for atmosphere and activity
    if (lowerDesc.includes('smoke') || lowerDesc.includes('smoky')) {
      keywords.push('smoke from chimneys');
    }
    if (lowerDesc.includes('merchant') || lowerDesc.includes('vendor')) {
      keywords.push('street vendors and merchants');
    }
    if (lowerDesc.includes('crowd') || lowerDesc.includes('busy') || lowerDesc.includes('bustle')) {
      keywords.push('bustling street life');
    }
    if (lowerDesc.includes('quiet') || lowerDesc.includes('peaceful')) {
      keywords.push('quiet atmosphere');
    }

    // Look for specific period details mentioned
    if (lowerDesc.includes('blacksmith')) {
      keywords.push('blacksmith shop visible');
    }
    if (lowerDesc.includes('church bell') || lowerDesc.includes('bell tower')) {
      keywords.push('church tower in background');
    }

    return keywords;
  }

  /**
   * Retrieves a cached city image if available
   * Tries multiple time-of-day variants to find any cached image
   */
  async getCachedCityImage(
    cityName: string,
    culturalZone: CulturalZone,
    year: number,
    preferredTimeOfDay?: string
  ): Promise<string | null> {
    if (!this.db) return null;

    const century = Math.floor(year / 100);

    // Time variants to check, in order of preference
    const timeVariants = preferredTimeOfDay
      ? [preferredTimeOfDay, 'afternoon', 'morning', 'noon', 'evening', 'dawn', 'night']
      : ['afternoon', 'morning', 'noon', 'evening', 'dawn', 'night'];

    // Remove duplicates while preserving order
    const uniqueTimeVariants = [...new Set(timeVariants)];

    // Try each time variant
    for (const timeOfDay of uniqueTimeVariants) {
      const cacheKey = `city-${cityName}-${culturalZone}-${century}-${timeOfDay}`;

      try {
        const cached = await this.getCachedImage(cacheKey);
        if (cached && cached.url) {
          console.log(`Found cached city image for ${cityName} at ${timeOfDay}`);
          return cached.url;
        }
      } catch (error) {
        console.error(`Error checking cache for ${cacheKey}:`, error);
      }
    }

    return null;
  }

  /**
   * Clears the entire image cache
   */
  async clearCache(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('Image cache cleared');
        resolve();
      };
      request.onerror = () => {
        console.error('Failed to clear cache:', request.error);
        resolve();
      };
    });
  }
}

// Export singleton instance
export const imageGenerationService = new ImageGenerationService();