/**
 * Special Map NPC Behavior Service
 * Makes NPCs hyper-aware of their context and behave accordingly
 */

import { NpcEntity, PlayerCharacter, Tile, BiomeType, HistoricalEra, CulturalZone } from '../types';
import { SpecialMapArchetype } from '../types/specialMapTypes';

export interface NpcMood {
  emotion: 'happy' | 'neutral' | 'annoyed' | 'angry' | 'fearful' | 'sad' | 'excited' | 'bored' | 'suspicious' | 'reverential';
  intensity: number; // 0-100
  reason: string;
}

export interface NpcActivity {
  action: string;
  location: { x: number; y: number };
  duration: number; // in game ticks
  interruptible: boolean;
  dialogue: string;
}

export interface NpcAttitude {
  baseDisposition: number; // -100 to 100
  modifiers: {
    reason: string;
    value: number;
  }[];
  willInteract: boolean;
  hostilityThreshold: number;
}

class SpecialMapNpcBehaviorService {
  private npcMoods: Map<string, NpcMood> = new Map();
  private npcActivities: Map<string, NpcActivity> = new Map();
  private npcAttitudes: Map<string, NpcAttitude> = new Map();

  /**
   * Determine NPC mood based on their exact location and context
   */
  public determineNpcMood(
    npc: NpcEntity,
    tile: Tile,
    mapArchetype: SpecialMapArchetype,
    timeOfDay: string,
    weather: string,
    playerPresent: boolean,
    era: HistoricalEra,
    zone: CulturalZone
  ): NpcMood {
    let mood: NpcMood = {
      emotion: 'neutral',
      intensity: 50,
      reason: 'default state'
    };

    // Location-specific moods
    switch (mapArchetype) {
      case SpecialMapArchetype.SACRED:
        if (tile.biome === BiomeType.ALTAR || tile.biome === BiomeType.SHRINE) {
          mood = {
            emotion: 'reverential',
            intensity: 80,
            reason: 'at sacred altar'
          };
        } else if (npc.profession?.includes('priest') || npc.profession?.includes('monk')) {
          mood = {
            emotion: 'happy',
            intensity: 70,
            reason: 'in their sacred space'
          };
        } else if (playerPresent && !this.isPlayerAppropriatelyDressed(era, zone, 'religious')) {
          mood = {
            emotion: 'suspicious',
            intensity: 60,
            reason: 'player dressed inappropriately for temple'
          };
        }
        break;

      case SpecialMapArchetype.MARKET:
        if (tile.biome === BiomeType.MARKETPLACE) {
          if (timeOfDay === 'morning' || timeOfDay === 'afternoon') {
            mood = {
              emotion: 'excited',
              intensity: 70,
              reason: 'busy market hours'
            };
          } else if (timeOfDay === 'evening') {
            mood = {
              emotion: 'bored',
              intensity: 40,
              reason: 'market closing soon'
            };
          }
        }
        if (npc.profession?.includes('merchant') || npc.profession?.includes('trader')) {
          if (this.hasCustomersNearby(npc, 3)) {
            mood.emotion = 'happy';
            mood.intensity = 75;
            mood.reason = 'good business';
          } else {
            mood.emotion = 'annoyed';
            mood.intensity = 45;
            mood.reason = 'no customers';
          }
        }
        break;

      case SpecialMapArchetype.GOVERNMENT_FORUM:
        if (tile.biome === BiomeType.GOVERNMENT_DISTRICT) {
          if (npc.profession?.includes('official') || npc.profession?.includes('clerk')) {
            mood = {
              emotion: 'neutral',
              intensity: 50,
              reason: 'performing duties'
            };
          } else if (npc.profession?.includes('petitioner') || npc.profession?.includes('citizen')) {
            mood = {
              emotion: 'annoyed',
              intensity: 65,
              reason: 'waiting in bureaucracy'
            };
          }
        }
        if (playerPresent && this.isPlayerWanted(era, zone)) {
          mood = {
            emotion: 'suspicious',
            intensity: 80,
            reason: 'recognized wanted person'
          };
        }
        break;

      case SpecialMapArchetype.THEATER:
        if (tile.biome === BiomeType.STAGE || this.isNearStage(tile)) {
          if (npc.profession?.includes('actor') || npc.profession?.includes('performer')) {
            mood = {
              emotion: 'excited',
              intensity: 85,
              reason: 'performing on stage'
            };
          } else if (npc.profession?.includes('audience')) {
            if (this.isPerformanceGood()) {
              mood = {
                emotion: 'happy',
                intensity: 70,
                reason: 'enjoying the show'
              };
            } else {
              mood = {
                emotion: 'bored',
                intensity: 30,
                reason: 'poor performance'
              };
            }
          }
        }
        break;

      case SpecialMapArchetype.UNIVERSITY:
        if (tile.biome === BiomeType.BOOKSHELF || tile.biome === BiomeType.DESK) {
          if (npc.profession?.includes('scholar') || npc.profession?.includes('student')) {
            mood = {
              emotion: 'neutral',
              intensity: 60,
              reason: 'studying'
            };
          }
        }
        if (playerPresent && this.isPlayerDisruptive()) {
          mood = {
            emotion: 'annoyed',
            intensity: 70,
            reason: 'player being disruptive in library'
          };
        }
        break;

      case SpecialMapArchetype.ESTATES:
        if (this.isInPrivateQuarters(tile)) {
          if (npc.profession?.includes('noble') || npc.profession?.includes('lord')) {
            mood = {
              emotion: 'neutral',
              intensity: 50,
              reason: 'in private chambers'
            };
          } else if (npc.profession?.includes('servant')) {
            mood = {
              emotion: 'fearful',
              intensity: 40,
              reason: 'must not disturb the masters'
            };
          }
        }
        if (playerPresent && !this.isPlayerInvited()) {
          mood = {
            emotion: 'angry',
            intensity: 80,
            reason: 'intruder in estate!'
          };
        }
        break;

      case SpecialMapArchetype.ARENA:
        if (tile.biome === BiomeType.SAND || this.isInArena(tile)) {
          if (npc.profession?.includes('gladiator') || npc.profession?.includes('fighter')) {
            mood = {
              emotion: 'excited',
              intensity: 90,
              reason: 'ready for combat'
            };
          } else if (npc.profession?.includes('spectator')) {
            mood = {
              emotion: 'excited',
              intensity: 75,
              reason: 'bloodthirsty crowd'
            };
          }
        }
        break;

      case SpecialMapArchetype.VESSEL:
        if (weather === 'storm') {
          mood = {
            emotion: 'fearful',
            intensity: 70,
            reason: 'rough seas'
          };
        } else if (npc.profession?.includes('sailor') || npc.profession?.includes('captain')) {
          mood = {
            emotion: 'neutral',
            intensity: 50,
            reason: 'at home on the sea'
          };
        } else if (npc.profession?.includes('passenger')) {
          if (this.isSeaSick(npc)) {
            mood = {
              emotion: 'sad',
              intensity: 60,
              reason: 'seasick'
            };
          }
        }
        break;

      case SpecialMapArchetype.EXHIBITION:
        if (this.isNearArtwork(tile)) {
          if (npc.profession?.includes('artist') || npc.profession?.includes('curator')) {
            mood = {
              emotion: 'happy',
              intensity: 65,
              reason: 'appreciating art'
            };
          } else if (npc.profession?.includes('critic')) {
            mood = {
              emotion: 'suspicious',
              intensity: 55,
              reason: 'judging the artwork'
            };
          }
        }
        break;
    }

    // Weather modifiers
    if (weather === 'rain' && this.isOutdoors(tile)) {
      mood.intensity -= 10;
      if (mood.emotion === 'happy') mood.emotion = 'neutral';
    }

    // Time of day modifiers
    if (timeOfDay === 'night' && !this.isNocturnal(npc)) {
      mood.intensity -= 15;
      if (mood.emotion === 'excited') mood.emotion = 'neutral';
    }

    this.npcMoods.set(npc.id, mood);
    return mood;
  }

  /**
   * Determine what the NPC should be doing based on location
   */
  public determineNpcActivity(
    npc: NpcEntity,
    tile: Tile,
    mapArchetype: SpecialMapArchetype,
    timeOfDay: string
  ): NpcActivity {
    let activity: NpcActivity = {
      action: 'idle',
      location: { x: npc.x, y: npc.y },
      duration: 10,
      interruptible: true,
      dialogue: 'Hmm...'
    };

    switch (mapArchetype) {
      case SpecialMapArchetype.SACRED:
        if (tile.biome === BiomeType.ALTAR) {
          activity = {
            action: 'praying',
            location: { x: npc.x, y: npc.y },
            duration: 60,
            interruptible: false,
            dialogue: '*whispers prayers*'
          };
        } else if (tile.biome === BiomeType.FOUNTAIN) {
          activity = {
            action: 'ritual_washing',
            location: { x: npc.x, y: npc.y },
            duration: 30,
            interruptible: true,
            dialogue: '*performs ablutions*'
          };
        } else if (npc.profession?.includes('priest')) {
          activity = {
            action: 'blessing_visitors',
            location: { x: npc.x, y: npc.y },
            duration: 20,
            interruptible: true,
            dialogue: 'May the gods smile upon you.'
          };
        }
        break;

      case SpecialMapArchetype.MARKET:
        if (npc.profession?.includes('merchant')) {
          activity = {
            action: 'hawking_wares',
            location: { x: npc.x, y: npc.y },
            duration: 15,
            interruptible: true,
            dialogue: 'Fresh goods! Best prices in town!'
          };
        } else if (npc.profession?.includes('customer')) {
          activity = {
            action: 'browsing_goods',
            location: { x: npc.x, y: npc.y },
            duration: 20,
            interruptible: true,
            dialogue: 'How much for this?'
          };
        } else if (npc.profession?.includes('thief')) {
          activity = {
            action: 'pickpocketing',
            location: { x: npc.x, y: npc.y },
            duration: 5,
            interruptible: false,
            dialogue: '*eyes the crowd*'
          };
        }
        break;

      case SpecialMapArchetype.GOVERNMENT_FORUM:
        if (npc.profession?.includes('official')) {
          activity = {
            action: 'stamping_documents',
            location: { x: npc.x, y: npc.y },
            duration: 30,
            interruptible: true,
            dialogue: 'Next! Have your papers ready.'
          };
        } else if (npc.profession?.includes('guard')) {
          activity = {
            action: 'patrolling',
            location: this.getPatrolPoint(npc),
            duration: 40,
            interruptible: false,
            dialogue: 'Move along, citizen.'
          };
        } else if (npc.profession?.includes('petitioner')) {
          activity = {
            action: 'waiting_in_line',
            location: { x: npc.x, y: npc.y },
            duration: 100,
            interruptible: false,
            dialogue: '*sighs* This line never moves...'
          };
        }
        break;

      case SpecialMapArchetype.THEATER:
        if (npc.profession?.includes('actor')) {
          if (this.isOnStage(tile)) {
            activity = {
              action: 'performing',
              location: { x: npc.x, y: npc.y },
              duration: 120,
              interruptible: false,
              dialogue: 'To be, or not to be!'
            };
          } else {
            activity = {
              action: 'preparing_backstage',
              location: { x: npc.x, y: npc.y },
              duration: 45,
              interruptible: true,
              dialogue: 'Where is my costume?'
            };
          }
        } else if (npc.profession?.includes('audience')) {
          activity = {
            action: 'watching_performance',
            location: { x: npc.x, y: npc.y },
            duration: 120,
            interruptible: false,
            dialogue: Math.random() > 0.5 ? '*applauds*' : '*boos*'
          };
        }
        break;

      case SpecialMapArchetype.UNIVERSITY:
        if (npc.profession?.includes('professor')) {
          activity = {
            action: 'lecturing',
            location: { x: npc.x, y: npc.y },
            duration: 90,
            interruptible: false,
            dialogue: 'As Aristotle once said...'
          };
        } else if (npc.profession?.includes('student')) {
          if (tile.biome === BiomeType.DESK) {
            activity = {
              action: 'studying',
              location: { x: npc.x, y: npc.y },
              duration: 60,
              interruptible: true,
              dialogue: '*reads intently*'
            };
          } else {
            activity = {
              action: 'discussing_philosophy',
              location: { x: npc.x, y: npc.y },
              duration: 30,
              interruptible: true,
              dialogue: 'But what if we consider...'
            };
          }
        }
        break;

      case SpecialMapArchetype.ESTATES:
        if (npc.profession?.includes('noble')) {
          if (timeOfDay === 'morning') {
            activity = {
              action: 'taking_breakfast',
              location: this.getDiningLocation(),
              duration: 45,
              interruptible: false,
              dialogue: 'The tea is cold. Summon the servants.'
            };
          } else if (timeOfDay === 'evening') {
            activity = {
              action: 'hosting_guests',
              location: this.getReceptionLocation(),
              duration: 120,
              interruptible: false,
              dialogue: 'Welcome to my humble estate.'
            };
          }
        } else if (npc.profession?.includes('servant')) {
          activity = {
            action: 'cleaning',
            location: this.getNextCleaningSpot(npc),
            duration: 30,
            interruptible: true,
            dialogue: '*dusts furniture*'
          };
        } else if (npc.profession?.includes('guard')) {
          activity = {
            action: 'guarding_entrance',
            location: this.getGuardPost(),
            duration: 180,
            interruptible: false,
            dialogue: 'State your business.'
          };
        }
        break;

      case SpecialMapArchetype.ARENA:
        if (npc.profession?.includes('gladiator')) {
          if (this.isFightTime()) {
            activity = {
              action: 'fighting',
              location: this.getArenaCenter(),
              duration: 60,
              interruptible: false,
              dialogue: 'For glory!'
            };
          } else {
            activity = {
              action: 'training',
              location: { x: npc.x, y: npc.y },
              duration: 40,
              interruptible: true,
              dialogue: '*practices sword swings*'
            };
          }
        } else if (npc.profession?.includes('spectator')) {
          activity = {
            action: 'cheering',
            location: { x: npc.x, y: npc.y },
            duration: 10,
            interruptible: true,
            dialogue: Math.random() > 0.5 ? 'Blood! Blood!' : 'Mercy!'
          };
        }
        break;

      case SpecialMapArchetype.VESSEL:
        if (npc.profession?.includes('captain')) {
          activity = {
            action: 'navigating',
            location: this.getHelmLocation(),
            duration: 200,
            interruptible: false,
            dialogue: 'Steady as she goes!'
          };
        } else if (npc.profession?.includes('sailor')) {
          activity = {
            action: 'working_rigging',
            location: this.getRiggingLocation(),
            duration: 45,
            interruptible: true,
            dialogue: 'Aye aye!'
          };
        } else if (npc.profession?.includes('passenger')) {
          if (this.isSeaSick(npc)) {
            activity = {
              action: 'being_seasick',
              location: this.getRailLocation(),
              duration: 20,
              interruptible: false,
              dialogue: '*groans* I hate ships...'
            };
          }
        }
        break;
    }

    this.npcActivities.set(npc.id, activity);
    return activity;
  }

  /**
   * Determine NPC's attitude toward the player
   */
  public determineNpcAttitude(
    npc: NpcEntity,
    player: PlayerCharacter,
    mapArchetype: SpecialMapArchetype,
    playerActions: string[]
  ): NpcAttitude {
    let attitude: NpcAttitude = {
      baseDisposition: 0,
      modifiers: [],
      willInteract: true,
      hostilityThreshold: -50
    };

    // Base disposition by profession and location
    switch (mapArchetype) {
      case SpecialMapArchetype.SACRED:
        if (npc.profession?.includes('priest')) {
          attitude.baseDisposition = 20; // Generally welcoming
          if (player.reputation < 0) {
            attitude.modifiers.push({
              reason: 'sinner',
              value: -30
            });
          }
        }
        if (playerActions.includes('steal_from_altar')) {
          attitude.modifiers.push({
            reason: 'sacrilege!',
            value: -100
          });
          attitude.willInteract = false;
        }
        break;

      case SpecialMapArchetype.MARKET:
        if (npc.profession?.includes('merchant')) {
          attitude.baseDisposition = 10; // Want to sell
          if (player.gold > 100) {
            attitude.modifiers.push({
              reason: 'wealthy customer',
              value: 20
            });
          }
        }
        if (playerActions.includes('caught_stealing')) {
          attitude.modifiers.push({
            reason: 'thief!',
            value: -80
          });
        }
        break;

      case SpecialMapArchetype.GOVERNMENT_FORUM:
        if (npc.profession?.includes('guard')) {
          attitude.baseDisposition = -10; // Naturally suspicious
          if (this.isPlayerWanted(player.era, player.culturalZone)) {
            attitude.modifiers.push({
              reason: 'wanted criminal',
              value: -100
            });
            attitude.hostilityThreshold = 0; // Immediately hostile
          }
        }
        if (player.inventory?.some(item => item.id === 'official_documents')) {
          attitude.modifiers.push({
            reason: 'has proper papers',
            value: 30
          });
        }
        break;

      case SpecialMapArchetype.ESTATES:
        if (npc.profession?.includes('noble')) {
          attitude.baseDisposition = -20; // Snobbish
          if (player.reputation > 50) {
            attitude.modifiers.push({
              reason: 'respected person',
              value: 40
            });
          }
          if (this.isPlayerDressedPoorly(player)) {
            attitude.modifiers.push({
              reason: 'dressed like a peasant',
              value: -40
            });
          }
        }
        if (!this.isPlayerInvited() && npc.profession?.includes('guard')) {
          attitude.modifiers.push({
            reason: 'trespasser',
            value: -100
          });
          attitude.willInteract = false;
        }
        break;

      case SpecialMapArchetype.UNIVERSITY:
        if (npc.profession?.includes('scholar')) {
          attitude.baseDisposition = 0;
          if (player.skills?.intelligence > 15) {
            attitude.modifiers.push({
              reason: 'fellow intellectual',
              value: 30
            });
          } else if (player.skills?.intelligence < 8) {
            attitude.modifiers.push({
              reason: 'simpleton',
              value: -20
            });
          }
        }
        break;

      case SpecialMapArchetype.ARENA:
        if (npc.profession?.includes('gladiator')) {
          attitude.baseDisposition = -5;
          if (player.skills?.combat > 20) {
            attitude.modifiers.push({
              reason: 'worthy opponent',
              value: 25
            });
          }
        }
        if (playerActions.includes('bet_against_favorite')) {
          attitude.modifiers.push({
            reason: 'bad bet',
            value: -30
          });
        }
        break;
    }

    // Universal modifiers
    if (player.health < 20) {
      attitude.modifiers.push({
        reason: 'looks diseased',
        value: -15
      });
    }

    if (playerActions.includes('gave_gift')) {
      attitude.modifiers.push({
        reason: 'generous',
        value: 20
      });
    }

    if (playerActions.includes('insulted')) {
      attitude.modifiers.push({
        reason: 'rude',
        value: -30
      });
    }

    // Calculate final disposition
    const totalModifiers = attitude.modifiers.reduce((sum, mod) => sum + mod.value, 0);
    const finalDisposition = attitude.baseDisposition + totalModifiers;

    // Determine if NPC will interact
    attitude.willInteract = finalDisposition > -30;

    // Store attitude
    this.npcAttitudes.set(`${npc.id}-${player.id}`, attitude);
    
    return attitude;
  }

  /**
   * Generate context-aware dialogue
   */
  public generateContextualDialogue(
    npc: NpcEntity,
    mood: NpcMood,
    activity: NpcActivity,
    attitude: NpcAttitude,
    mapArchetype: SpecialMapArchetype
  ): string[] {
    const dialogues: string[] = [];

    // Mood-based greeting
    if (mood.emotion === 'angry') {
      dialogues.push('What do YOU want?!');
    } else if (mood.emotion === 'fearful') {
      dialogues.push('P-please don\'t hurt me...');
    } else if (mood.emotion === 'happy') {
      dialogues.push('Well met, friend!');
    } else if (mood.emotion === 'suspicious') {
      dialogues.push('I\'m watching you...');
    } else if (mood.emotion === 'reverential') {
      dialogues.push('Welcome to this sacred place.');
    }

    // Activity-based dialogue
    dialogues.push(activity.dialogue);

    // Location-specific dialogue
    switch (mapArchetype) {
      case SpecialMapArchetype.SACRED:
        if (npc.profession?.includes('priest')) {
          dialogues.push(
            'The gods observe all that happens here.',
            'Have you come to make an offering?',
            'Silence is golden in these halls.'
          );
        }
        break;

      case SpecialMapArchetype.MARKET:
        if (npc.profession?.includes('merchant')) {
          dialogues.push(
            'I\'ve got the finest wares in the land!',
            'Special price, just for you!',
            'No refunds!'
          );
        }
        break;

      case SpecialMapArchetype.GOVERNMENT_FORUM:
        if (npc.profession?.includes('official')) {
          dialogues.push(
            'Do you have an appointment?',
            'Fill out form 27-B first.',
            'The magistrate is busy.'
          );
        }
        break;

      case SpecialMapArchetype.ESTATES:
        if (npc.profession?.includes('noble')) {
          dialogues.push(
            'I don\'t recall inviting you.',
            'The servants will show you out.',
            'How dare you address me directly!'
          );
        } else if (npc.profession?.includes('servant')) {
          dialogues.push(
            'The master must not be disturbed.',
            'I\'m not allowed to speak to guests.',
            'Please use the servants\' entrance.'
          );
        }
        break;
    }

    // Attitude-based dialogue
    const totalDisposition = attitude.baseDisposition + 
      attitude.modifiers.reduce((sum, mod) => sum + mod.value, 0);
    
    if (totalDisposition < -50) {
      dialogues.push('Get out of my sight!');
    } else if (totalDisposition < 0) {
      dialogues.push('I don\'t like the look of you.');
    } else if (totalDisposition > 50) {
      dialogues.push('You seem trustworthy.');
    }

    return dialogues;
  }

  // Helper methods
  private isPlayerAppropriatelyDressed(era: HistoricalEra, zone: CulturalZone, context: string): boolean {
    // Check player's clothing items
    return Math.random() > 0.3; // Placeholder
  }

  private hasCustomersNearby(npc: NpcEntity, radius: number): boolean {
    // Check for other NPCs within radius
    return Math.random() > 0.5;
  }

  private isPlayerWanted(era: HistoricalEra, zone: CulturalZone): boolean {
    // Check if player has criminal status
    return false; // Placeholder
  }

  private isNearStage(tile: Tile): boolean {
    return tile.biome === BiomeType.FLOOR_WOOD || tile.biome === BiomeType.DAIS;
  }

  private isPerformanceGood(): boolean {
    return Math.random() > 0.4;
  }

  private isPlayerDisruptive(): boolean {
    // Check recent player actions
    return false;
  }

  private isInPrivateQuarters(tile: Tile): boolean {
    return tile.biome === BiomeType.BED || tile.biome === BiomeType.THRONE;
  }

  private isPlayerInvited(): boolean {
    // Check if player has invitation
    return false;
  }

  private isInArena(tile: Tile): boolean {
    return tile.biome === BiomeType.SAND || tile.biome === BiomeType.PLAZA;
  }

  private isSeaSick(npc: NpcEntity): boolean {
    return !npc.profession?.includes('sailor') && Math.random() > 0.7;
  }

  private isNearArtwork(tile: Tile): boolean {
    return tile.biome === BiomeType.STATUE || tile.biome === BiomeType.WALL;
  }

  private isOutdoors(tile: Tile): boolean {
    return ![BiomeType.FLOOR_STONE, BiomeType.FLOOR_WOOD, BiomeType.FLOOR_CARPET].includes(tile.biome);
  }

  private isNocturnal(npc: NpcEntity): boolean {
    return npc.profession?.includes('guard') || npc.profession?.includes('thief');
  }

  private isOnStage(tile: Tile): boolean {
    return tile.biome === BiomeType.DAIS || tile.biome === BiomeType.STAGE;
  }

  private isPlayerDressedPoorly(player: PlayerCharacter): boolean {
    // Check player's clothing value
    return player.gold < 50;
  }

  private isFightTime(): boolean {
    // Check game time for scheduled fights
    return Math.random() > 0.7;
  }

  // Location helpers
  private getPatrolPoint(npc: NpcEntity): { x: number; y: number } {
    return { 
      x: npc.x + Math.floor(Math.random() * 6 - 3), 
      y: npc.y + Math.floor(Math.random() * 6 - 3) 
    };
  }

  private getDiningLocation(): { x: number; y: number } {
    return { x: 10, y: 10 }; // Placeholder
  }

  private getReceptionLocation(): { x: number; y: number } {
    return { x: 15, y: 15 }; // Placeholder
  }

  private getNextCleaningSpot(npc: NpcEntity): { x: number; y: number } {
    return { 
      x: npc.x + Math.floor(Math.random() * 4 - 2), 
      y: npc.y + Math.floor(Math.random() * 4 - 2) 
    };
  }

  private getGuardPost(): { x: number; y: number } {
    return { x: 5, y: 5 }; // Placeholder
  }

  private getArenaCenter(): { x: number; y: number } {
    return { x: 20, y: 20 }; // Placeholder
  }

  private getHelmLocation(): { x: number; y: number } {
    return { x: 10, y: 5 }; // Placeholder
  }

  private getRiggingLocation(): { x: number; y: number } {
    return { x: 15, y: 10 }; // Placeholder
  }

  private getRailLocation(): { x: number; y: number } {
    return { x: 5, y: 15 }; // Placeholder
  }
}

export const specialMapNpcBehaviorService = new SpecialMapNpcBehaviorService();

/**
 * Check if an NPC is a guard type
 */
export function isGuardType(npc: NpcEntity): boolean {
  const guardProfessions = [
    'guard', 'soldier', 'sentry', 'watchman', 
    'palace guard', 'temple guard', 'security',
    'enforcer', 'protector', 'sentinel', 'officer',
    'praetorian', 'mamluk', 'janissary', 'samurai', 'knight',
    'imperial guard', 'royal guard', 'guard captain'
  ];
  
  if (!npc.profession) {
    return false;
  }
  
  const professionLower = npc.profession.toLowerCase();
  const isGuard = guardProfessions.some(prof => professionLower.includes(prof));
  return isGuard;
}

/**
 * Get the alert radius for a guard based on map archetype
 */
export function getGuardAlertRadius(
  npc: NpcEntity, 
  mapArchetype: SpecialMapArchetype
): number {
  // Different detection ranges by location
  switch(mapArchetype) {
    case SpecialMapArchetype.ESTATES:
      return 4; // Larger detection in private estates
    case SpecialMapArchetype.SACRED:
      return 2; // Smaller range in temples
    case SpecialMapArchetype.GOVERNMENT_FORUM:
    case SpecialMapArchetype.GOVERNMENT:
      return 3; // Medium range in government buildings
    case SpecialMapArchetype.ARENA:
    case SpecialMapArchetype.ARENA_THEATER:
      return 2; // Guards mainly at entrances
    default:
      return 3; // Default detection radius
  }
}