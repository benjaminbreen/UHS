/**
 * services/imageGenerationService.ts - AI image generation service using Runware API
 * Cost-effective image generation for game items at $0.0006 per image
 */
import { Runware } from '@runware/sdk-js';
import { Item, PlayerCharacter, CulturalZone } from '../types';

interface ImageGenerationContext {
  item: Item;
  culturalZone?: CulturalZone;
  year?: number;
  playerProfession?: string;
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