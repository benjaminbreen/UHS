/**
 * GameSounds Service
 * Centralized procedural sound effects for the game using Web Audio API
 * All sounds are generated programmatically - no external files needed!
 */

class GameSoundsService {
  private static instance: GameSoundsService;
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.5;
  private currentRainSource: AudioBufferSourceNode | null = null;
  private currentHeavyRainSource: AudioBufferSourceNode | null = null;
  private currentGenericMusicSources: AudioBufferSourceNode[] = [];
  private currentMarketplaceAmbientSources: AudioBufferSourceNode[] = [];
  private currentIntenseBattleMusicSources: AudioBufferSourceNode[] = [];
  private genericMusicPlaying: boolean = false;
  private marketplacePlaying: boolean = false;
  private battlePlaying: boolean = false;
  private genericMusicNodes: any[] = [];
  private marketplaceNodes: any[] = [];
  private battleNodes: any[] = [];

  private constructor() {
    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
    }
  }

  public static getInstance(): GameSoundsService {
    if (!GameSoundsService.instance) {
      GameSoundsService.instance = new GameSoundsService();
    }
    return GameSoundsService.instance;
  }

  private initializeAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
    }
  }

  private ensureAudioContext(): AudioContext | null {
    if (!this.audioContext) {
      this.initializeAudioContext();
    }
    return this.audioContext;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute() {
    this.isMuted = !this.isMuted;
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  public setVolume(volume: number) {
    this.setMasterVolume(volume);
  }

  /**
   * 1. DAMAGE/INJURY SOUND - "Ouch" effect for HP loss
   */
  public playDamageSound(severity: 'light' | 'medium' | 'heavy' = 'medium') {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Impact thud
      const impact = ctx.createOscillator();
      const impactGain = ctx.createGain();
      const impactFilter = ctx.createBiquadFilter();
      
      impact.connect(impactFilter);
      impactFilter.connect(impactGain);
      impactGain.connect(ctx.destination);
      
      // Severity affects frequency and volume
      const freqMap = { light: 80, medium: 60, heavy: 40 };
      impact.frequency.value = freqMap[severity];
      impact.type = 'sawtooth';
      
      impactFilter.type = 'lowpass';
      impactFilter.frequency.value = 150;
      impactFilter.Q.value = 5;
      
      const volumeMap = { light: 0.2, medium: 0.3, heavy: 0.4 };
      impactGain.gain.setValueAtTime(0, now);
      impactGain.gain.linearRampToValueAtTime(volumeMap[severity] * this.masterVolume, now + 0.01);
      impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      impact.start(now);
      impact.stop(now + 0.15);
      
      // Pain "wince" sound
      const wince = ctx.createOscillator();
      const winceGain = ctx.createGain();
      
      wince.connect(winceGain);
      winceGain.connect(ctx.destination);
      
      wince.frequency.value = 200;
      wince.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      wince.type = 'sine';
      
      winceGain.gain.setValueAtTime(0, now);
      winceGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.02);
      winceGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      wince.start(now + 0.01);
      wince.stop(now + 0.11);
      
      // Add crunch for heavy damage
      if (severity === 'heavy') {
        const crunch = ctx.createOscillator();
        const crunchGain = ctx.createGain();
        const crunchFilter = ctx.createBiquadFilter();
        
        crunch.connect(crunchFilter);
        crunchFilter.connect(crunchGain);
        crunchGain.connect(ctx.destination);
        
        crunch.frequency.value = 30;
        crunch.type = 'square';
        crunchFilter.type = 'bandpass';
        crunchFilter.frequency.value = 100;
        crunchFilter.Q.value = 10;
        
        crunchGain.gain.setValueAtTime(0.15 * this.masterVolume, now);
        crunchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        crunch.start(now);
        crunch.stop(now + 0.05);
      }
    } catch (error) {
      console.error('Error playing damage sound:', error);
    }
  }

  /**
   * 2. LEVEL UP FANFARE - Triumphant achievement sound
   */
  public playLevelUpSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Triumphant chord progression: C → F → G → C (octave)
      const notes = [
        { freq: 261.63, time: 0 },      // C4
        { freq: 329.63, time: 0.1 },    // E4
        { freq: 392.00, time: 0.2 },    // G4
        { freq: 349.23, time: 0.3 },    // F4
        { freq: 440.00, time: 0.4 },    // A4
        { freq: 523.25, time: 0.5 },    // C5
        { freq: 659.25, time: 0.6 },    // E5
        { freq: 783.99, time: 0.7 },    // G5
        { freq: 1046.50, time: 0.8 }    // C6
      ];
      
      notes.forEach(note => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = note.freq;
        osc.type = 'sine';
        
        const startTime = now + note.time;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
      
      // Add sparkle effect
      for (let i = 0; i < 10; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        
        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        
        sparkle.frequency.value = 2000 + Math.random() * 2000;
        sparkle.type = 'sine';
        
        const sparkleTime = now + 0.3 + (i * 0.05);
        sparkleGain.gain.setValueAtTime(0, sparkleTime);
        sparkleGain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, sparkleTime + 0.01);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.1);
        
        sparkle.start(sparkleTime);
        sparkle.stop(sparkleTime + 0.1);
      }
    } catch (error) {
      console.error('Error playing level up sound:', error);
    }
  }

  /**
   * 3. TRADE SUCCESS - Coin cascade sound
   */
  public playTradeSuccessSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Multiple coin clinks
      for (let i = 0; i < 5; i++) {
        const coin = ctx.createOscillator();
        const coinGain = ctx.createGain();
        const coinFilter = ctx.createBiquadFilter();
        
        coin.connect(coinFilter);
        coinFilter.connect(coinGain);
        coinGain.connect(ctx.destination);
        
        // Each coin has slightly different pitch
        coin.frequency.value = 2000 + (i * 200);
        coin.type = 'triangle';
        
        coinFilter.type = 'highpass';
        coinFilter.frequency.value = 1500;
        coinFilter.Q.value = 10;
        
        const startTime = now + (i * 0.05);
        coinGain.gain.setValueAtTime(0, startTime);
        coinGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, startTime + 0.001);
        coinGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
        
        coin.start(startTime);
        coin.stop(startTime + 0.2);
      }
      
      // Add a subtle "bag of coins" rustle
      const rustleBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const rustleData = rustleBuffer.getChannelData(0);
      for (let i = 0; i < rustleData.length; i++) {
        rustleData[i] = (Math.random() - 0.5) * 0.05 * Math.exp(-i / (ctx.sampleRate * 0.1));
      }
      
      const rustleSource = ctx.createBufferSource();
      const rustleGain = ctx.createGain();
      const rustleFilter = ctx.createBiquadFilter();
      
      rustleSource.buffer = rustleBuffer;
      rustleSource.connect(rustleFilter);
      rustleFilter.connect(rustleGain);
      rustleGain.connect(ctx.destination);
      
      rustleFilter.type = 'bandpass';
      rustleFilter.frequency.value = 3000;
      rustleFilter.Q.value = 5;
      
      rustleGain.gain.value = 0.3 * this.masterVolume;
      
      rustleSource.start(now + 0.1);
    } catch (error) {
      console.error('Error playing trade sound:', error);
    }
  }

  /**
   * 4. COMBAT START - War horn and drum
   */
  public playCombatStartSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // War horn
      const horn = ctx.createOscillator();
      const hornGain = ctx.createGain();
      const hornFilter = ctx.createBiquadFilter();
      
      horn.connect(hornFilter);
      hornFilter.connect(hornGain);
      hornGain.connect(ctx.destination);
      
      horn.frequency.value = 130.81; // C3
      horn.type = 'sawtooth';
      
      hornFilter.type = 'lowpass';
      hornFilter.frequency.value = 800;
      hornFilter.Q.value = 2;
      
      hornGain.gain.setValueAtTime(0, now);
      hornGain.gain.linearRampToValueAtTime(0.4 * this.masterVolume, now + 0.1);
      hornGain.gain.setValueAtTime(0.4 * this.masterVolume, now + 0.3);
      hornGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      horn.start(now);
      horn.stop(now + 0.8);
      
      // Drum hit
      const drum = ctx.createOscillator();
      const drumGain = ctx.createGain();
      const drumFilter = ctx.createBiquadFilter();
      
      drum.connect(drumFilter);
      drumFilter.connect(drumGain);
      drumGain.connect(ctx.destination);
      
      drum.frequency.value = 60;
      drum.frequency.exponentialRampToValueAtTime(30, now + 0.1);
      drum.type = 'sine';
      
      drumFilter.type = 'lowpass';
      drumFilter.frequency.value = 100;
      
      drumGain.gain.setValueAtTime(0.5 * this.masterVolume, now);
      drumGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      drum.start(now);
      drum.stop(now + 0.2);
    } catch (error) {
      console.error('Error playing combat sound:', error);
    }
  }

  /**
   * 5. ITEM PICKUP - Different sounds for different item types
   */
  public playItemPickupSound(itemType: 'food' | 'weapon' | 'document' | 'gold' | 'generic' = 'generic') {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      switch(itemType) {
        case 'food':
          // Soft thud with bag rustle
          const thud = ctx.createOscillator();
          const thudGain = ctx.createGain();
          
          thud.connect(thudGain);
          thudGain.connect(ctx.destination);
          
          thud.frequency.value = 100;
          thud.type = 'sine';
          
          thudGain.gain.setValueAtTime(0.2 * this.masterVolume, now);
          thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          
          thud.start(now);
          thud.stop(now + 0.1);
          break;
          
        case 'weapon':
          // Metallic clink
          const clink = ctx.createOscillator();
          const clinkGain = ctx.createGain();
          const clinkFilter = ctx.createBiquadFilter();
          
          clink.connect(clinkFilter);
          clinkFilter.connect(clinkGain);
          clinkGain.connect(ctx.destination);
          
          clink.frequency.value = 1500;
          clink.type = 'triangle';
          
          clinkFilter.type = 'highpass';
          clinkFilter.frequency.value = 1000;
          clinkFilter.Q.value = 10;
          
          clinkGain.gain.setValueAtTime(0, now);
          clinkGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.001);
          clinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          
          clink.start(now);
          clink.stop(now + 0.2);
          break;
          
        case 'document':
          // Paper shuffle - white noise burst
          const paperBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
          const paperData = paperBuffer.getChannelData(0);
          for (let i = 0; i < paperData.length; i++) {
            paperData[i] = (Math.random() - 0.5) * 0.1;
          }
          
          const paperSource = ctx.createBufferSource();
          const paperGain = ctx.createGain();
          const paperFilter = ctx.createBiquadFilter();
          
          paperSource.buffer = paperBuffer;
          paperSource.connect(paperFilter);
          paperFilter.connect(paperGain);
          paperGain.connect(ctx.destination);
          
          paperFilter.type = 'bandpass';
          paperFilter.frequency.value = 2000;
          paperFilter.Q.value = 5;
          
          paperGain.gain.value = 0.2 * this.masterVolume;
          
          paperSource.start(now);
          break;
          
        case 'gold':
          // Single coin ding
          const goldCoin = ctx.createOscillator();
          const goldGain = ctx.createGain();
          
          goldCoin.connect(goldGain);
          goldGain.connect(ctx.destination);
          
          goldCoin.frequency.value = 2500;
          goldCoin.type = 'triangle';
          
          goldGain.gain.setValueAtTime(0, now);
          goldGain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + 0.001);
          goldGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          
          goldCoin.start(now);
          goldCoin.stop(now + 0.3);
          break;
          
        default:
          // Generic pickup
          const pickup = ctx.createOscillator();
          const pickupGain = ctx.createGain();
          
          pickup.connect(pickupGain);
          pickupGain.connect(ctx.destination);
          
          pickup.frequency.value = 400;
          pickup.frequency.exponentialRampToValueAtTime(600, now + 0.05);
          pickup.type = 'sine';
          
          pickupGain.gain.setValueAtTime(0, now);
          pickupGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.01);
          pickupGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          
          pickup.start(now);
          pickup.stop(now + 0.1);
      }
    } catch (error) {
      console.error('Error playing item pickup sound:', error);
    }
  }

  /**
   * 6. ENVIRONMENTAL HAZARD SOUNDS
   */
  public playEnvironmentalHazardSound(hazardType: 'cold' | 'heat' | 'poison' | 'disease') {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      switch(hazardType) {
        case 'cold':
          // Wind howl with crystalline effect
          const wind = ctx.createOscillator();
          const windGain = ctx.createGain();
          const windFilter = ctx.createBiquadFilter();
          
          wind.connect(windFilter);
          windFilter.connect(windGain);
          windGain.connect(ctx.destination);
          
          wind.frequency.value = 200;
          wind.type = 'sawtooth';
          
          windFilter.type = 'bandpass';
          windFilter.frequency.value = 400;
          windFilter.frequency.linearRampToValueAtTime(800, now + 1);
          windFilter.Q.value = 2;
          
          windGain.gain.setValueAtTime(0, now);
          windGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.3);
          windGain.gain.setValueAtTime(0.2 * this.masterVolume, now + 0.7);
          windGain.gain.exponentialRampToValueAtTime(0.01, now + 1);
          
          wind.start(now);
          wind.stop(now + 1);
          
          // Ice crystals
          for (let i = 0; i < 5; i++) {
            const crystal = ctx.createOscillator();
            const crystalGain = ctx.createGain();
            
            crystal.connect(crystalGain);
            crystalGain.connect(ctx.destination);
            
            crystal.frequency.value = 3000 + (i * 500);
            crystal.type = 'sine';
            
            const crystalTime = now + 0.2 + (i * 0.1);
            crystalGain.gain.setValueAtTime(0, crystalTime);
            crystalGain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, crystalTime + 0.01);
            crystalGain.gain.exponentialRampToValueAtTime(0.001, crystalTime + 0.05);
            
            crystal.start(crystalTime);
            crystal.stop(crystalTime + 0.05);
          }
          break;
          
        case 'heat':
          // Desert wind with sizzle
          const heatWind = ctx.createOscillator();
          const heatGain = ctx.createGain();
          const heatFilter = ctx.createBiquadFilter();
          
          heatWind.connect(heatFilter);
          heatFilter.connect(heatGain);
          heatGain.connect(ctx.destination);
          
          heatWind.frequency.value = 100;
          heatWind.type = 'sawtooth';
          
          heatFilter.type = 'lowpass';
          heatFilter.frequency.value = 300;
          
          heatGain.gain.setValueAtTime(0.15 * this.masterVolume, now);
          heatGain.gain.setValueAtTime(0.15 * this.masterVolume, now + 0.5);
          heatGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
          
          heatWind.start(now);
          heatWind.stop(now + 0.8);
          
          // Sizzle
          const sizzleBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
          const sizzleData = sizzleBuffer.getChannelData(0);
          for (let i = 0; i < sizzleData.length; i++) {
            sizzleData[i] = (Math.random() - 0.5) * 0.1 * Math.sin(i * 0.01);
          }
          
          const sizzleSource = ctx.createBufferSource();
          const sizzleGain = ctx.createGain();
          const sizzleFilter = ctx.createBiquadFilter();
          
          sizzleSource.buffer = sizzleBuffer;
          sizzleSource.connect(sizzleFilter);
          sizzleFilter.connect(sizzleGain);
          sizzleGain.connect(ctx.destination);
          
          sizzleFilter.type = 'highpass';
          sizzleFilter.frequency.value = 2000;
          
          sizzleGain.gain.value = 0.1 * this.masterVolume;
          
          sizzleSource.start(now);
          break;
          
        case 'poison':
        case 'disease':
          // Ominous low rumble with dissonant tones
          const rumble = ctx.createOscillator();
          const rumbleGain = ctx.createGain();
          const rumbleFilter = ctx.createBiquadFilter();
          
          rumble.connect(rumbleFilter);
          rumbleFilter.connect(rumbleGain);
          rumbleGain.connect(ctx.destination);
          
          rumble.frequency.value = 40;
          rumble.type = 'sawtooth';
          
          rumbleFilter.type = 'lowpass';
          rumbleFilter.frequency.value = 80;
          
          rumbleGain.gain.setValueAtTime(0, now);
          rumbleGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.2);
          rumbleGain.gain.setValueAtTime(0.3 * this.masterVolume, now + 0.5);
          rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
          
          rumble.start(now);
          rumble.stop(now + 0.8);
          
          // Dissonant tone
          const dissonant = ctx.createOscillator();
          const dissonantGain = ctx.createGain();
          
          dissonant.connect(dissonantGain);
          dissonantGain.connect(ctx.destination);
          
          dissonant.frequency.value = 415.3; // G# (dissonant with low C)
          dissonant.type = 'sine';
          
          dissonantGain.gain.setValueAtTime(0, now);
          dissonantGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.3);
          dissonantGain.gain.setValueAtTime(0.1 * this.masterVolume, now + 0.5);
          dissonantGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
          
          dissonant.start(now + 0.1);
          dissonant.stop(now + 0.7);
          break;
      }
    } catch (error) {
      console.error('Error playing environmental hazard sound:', error);
    }
  }

  /**
   * 7. NOTIFICATION SOUNDS - Different tones for different toast types
   */
  public playNotificationSound(type: 'success' | 'warning' | 'error' | 'info' = 'info') {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      switch(type) {
        case 'success':
          // Ascending arpeggio
          const successNotes = [261.63, 329.63, 392.00, 523.25]; // C-E-G-C
          successNotes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            const startTime = now + (i * 0.05);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, startTime + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
          });
          break;
          
        case 'warning':
          // Two-tone alert
          for (let i = 0; i < 2; i++) {
            const alert = ctx.createOscillator();
            const alertGain = ctx.createGain();
            
            alert.connect(alertGain);
            alertGain.connect(ctx.destination);
            
            alert.frequency.value = i === 0 ? 440 : 349.23; // A4 then F4
            alert.type = 'triangle';
            
            const startTime = now + (i * 0.15);
            alertGain.gain.setValueAtTime(0, startTime);
            alertGain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, startTime + 0.01);
            alertGain.gain.setValueAtTime(0.25 * this.masterVolume, startTime + 0.1);
            alertGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.14);
            
            alert.start(startTime);
            alert.stop(startTime + 0.14);
          }
          break;
          
        case 'error':
          // Descending buzz
          const error = ctx.createOscillator();
          const errorGain = ctx.createGain();
          const errorFilter = ctx.createBiquadFilter();
          
          error.connect(errorFilter);
          errorFilter.connect(errorGain);
          errorGain.connect(ctx.destination);
          
          error.frequency.value = 200;
          error.frequency.exponentialRampToValueAtTime(50, now + 0.2);
          error.type = 'sawtooth';
          
          errorFilter.type = 'lowpass';
          errorFilter.frequency.value = 400;
          
          errorGain.gain.setValueAtTime(0.3 * this.masterVolume, now);
          errorGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          
          error.start(now);
          error.stop(now + 0.2);
          break;
          
        case 'info':
        default:
          // Single soft chime
          const info = ctx.createOscillator();
          const infoGain = ctx.createGain();
          
          info.connect(infoGain);
          infoGain.connect(ctx.destination);
          
          info.frequency.value = 523.25; // C5
          info.type = 'sine';
          
          infoGain.gain.setValueAtTime(0, now);
          infoGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.01);
          infoGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          
          info.start(now);
          info.stop(now + 0.2);
          break;
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * 8. TIME PROGRESSION AMBIENCE
   */
  public playTimeTransitionSound(timeOfDay: 'dawn' | 'noon' | 'dusk' | 'midnight') {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      switch(timeOfDay) {
        case 'dawn':
          // Rooster crow simulation (simplified)
          const crow = ctx.createOscillator();
          const crowGain = ctx.createGain();
          const crowFilter = ctx.createBiquadFilter();
          
          crow.connect(crowFilter);
          crowFilter.connect(crowGain);
          crowGain.connect(ctx.destination);
          
          crow.frequency.value = 400;
          crow.frequency.setValueAtTime(400, now);
          crow.frequency.linearRampToValueAtTime(800, now + 0.2);
          crow.frequency.setValueAtTime(800, now + 0.4);
          crow.frequency.linearRampToValueAtTime(600, now + 0.6);
          crow.type = 'sawtooth';
          
          crowFilter.type = 'bandpass';
          crowFilter.frequency.value = 600;
          crowFilter.Q.value = 5;
          
          crowGain.gain.setValueAtTime(0, now);
          crowGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.1);
          crowGain.gain.setValueAtTime(0.3 * this.masterVolume, now + 0.4);
          crowGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
          
          crow.start(now);
          crow.stop(now + 0.8);
          break;
          
        case 'noon':
          // Bell tower chime
          const bells = [523.25, 659.25, 783.99, 523.25]; // C-E-G-C
          bells.forEach((freq, i) => {
            const bell = ctx.createOscillator();
            const bellGain = ctx.createGain();
            const bellFilter = ctx.createBiquadFilter();
            
            bell.connect(bellFilter);
            bellFilter.connect(bellGain);
            bellGain.connect(ctx.destination);
            
            bell.frequency.value = freq;
            bell.type = 'triangle';
            
            bellFilter.type = 'highpass';
            bellFilter.frequency.value = 200;
            
            const startTime = now + (i * 0.3);
            bellGain.gain.setValueAtTime(0, startTime);
            bellGain.gain.linearRampToValueAtTime(0.4 * this.masterVolume, startTime + 0.01);
            bellGain.gain.exponentialRampToValueAtTime(0.01, startTime + 1);
            
            bell.start(startTime);
            bell.stop(startTime + 1);
          });
          break;
          
        case 'dusk':
          // Cricket chirps
          for (let i = 0; i < 10; i++) {
            const cricket = ctx.createOscillator();
            const cricketGain = ctx.createGain();
            const cricketFilter = ctx.createBiquadFilter();
            
            cricket.connect(cricketFilter);
            cricketFilter.connect(cricketGain);
            cricketGain.connect(ctx.destination);
            
            cricket.frequency.value = 4000 + Math.random() * 1000;
            cricket.type = 'sine';
            
            cricketFilter.type = 'bandpass';
            cricketFilter.frequency.value = 4500;
            cricketFilter.Q.value = 10;
            
            const startTime = now + (i * 0.1) + Math.random() * 0.05;
            cricketGain.gain.setValueAtTime(0, startTime);
            cricketGain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, startTime + 0.01);
            cricketGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.05);
            
            cricket.start(startTime);
            cricket.stop(startTime + 0.05);
          }
          break;
          
        case 'midnight':
          // Owl hoot
          const owl = ctx.createOscillator();
          const owlGain = ctx.createGain();
          const owlFilter = ctx.createBiquadFilter();
          
          owl.connect(owlFilter);
          owlFilter.connect(owlGain);
          owlGain.connect(ctx.destination);
          
          owl.frequency.value = 200;
          owl.type = 'sine';
          
          owlFilter.type = 'lowpass';
          owlFilter.frequency.value = 400;
          
          // "Hoo-hoo" pattern
          owlGain.gain.setValueAtTime(0, now);
          owlGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.1);
          owlGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          owlGain.gain.setValueAtTime(0, now + 0.4);
          owlGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.5);
          owlGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
          
          owl.start(now);
          owl.stop(now + 0.7);
          break;
      }
    } catch (error) {
      console.error('Error playing time transition sound:', error);
    }
  }

  /**
   * 9. DISCOVERY SOUND - For finding primary sources, ruins, etc.
   */
  public playDiscoverySound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Mystical ascending notes
      const notes = [261.63, 311.13, 392.00, 466.16, 523.25]; // C-Eb-G-Bb-C (C minor 7)
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        filter.type = 'bandpass';
        filter.frequency.value = freq;
        filter.Q.value = 10;
        
        const startTime = now + (i * 0.1);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1);
        
        osc.start(startTime);
        osc.stop(startTime + 1);
      });
      
      // Add shimmer effect
      const shimmerBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const shimmerData = shimmerBuffer.getChannelData(0);
      for (let i = 0; i < shimmerData.length; i++) {
        shimmerData[i] = (Math.random() - 0.5) * 0.05 * Math.exp(-i / (ctx.sampleRate * 0.2));
      }
      
      const shimmerSource = ctx.createBufferSource();
      const shimmerGain = ctx.createGain();
      const shimmerFilter = ctx.createBiquadFilter();
      
      shimmerSource.buffer = shimmerBuffer;
      shimmerSource.connect(shimmerFilter);
      shimmerFilter.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      
      shimmerFilter.type = 'highpass';
      shimmerFilter.frequency.value = 3000;
      
      shimmerGain.gain.value = 0.2 * this.masterVolume;
      
      shimmerSource.start(now + 0.2);
    } catch (error) {
      console.error('Error playing discovery sound:', error);
    }
  }

  /**
   * 10. UI CLICK SOUND - For buttons and interface elements
   */
  public playUIClickSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Quick click
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      
      click.frequency.value = 1000;
      click.type = 'sine';
      
      clickGain.gain.setValueAtTime(0, now);
      clickGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.001);
      clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
      
      click.start(now);
      click.stop(now + 0.03);
    } catch (error) {
      console.error('Error playing UI click sound:', error);
    }
  }

  /**
   * 11. NPC APPROACH SOUND - Footsteps
   */
  public playNPCApproachSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Three footsteps
      for (let i = 0; i < 3; i++) {
        const step = ctx.createOscillator();
        const stepGain = ctx.createGain();
        const stepFilter = ctx.createBiquadFilter();
        
        step.connect(stepFilter);
        stepFilter.connect(stepGain);
        stepGain.connect(ctx.destination);
        
        step.frequency.value = 60;
        step.type = 'sawtooth';
        
        stepFilter.type = 'lowpass';
        stepFilter.frequency.value = 100;
        
        const startTime = now + (i * 0.3);
        stepGain.gain.setValueAtTime(0.15 * this.masterVolume, startTime);
        stepGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        
        step.start(startTime);
        step.stop(startTime + 0.1);
      }
    } catch (error) {
      console.error('Error playing NPC approach sound:', error);
    }
  }

  /**
   * 12. QUEST ACCEPTED SOUND
   */
  public playQuestAcceptedSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Pleasant chime with echo
      const notes = [523.25, 659.25, 783.99]; // C-E-G
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        const startTime = now + (i * 0.05);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        osc.start(startTime);
        osc.stop(startTime + 0.5);
        
        // Echo
        const echo = ctx.createOscillator();
        const echoGain = ctx.createGain();
        
        echo.connect(echoGain);
        echoGain.connect(ctx.destination);
        
        echo.frequency.value = freq;
        echo.type = 'sine';
        
        const echoTime = startTime + 0.2;
        echoGain.gain.setValueAtTime(0, echoTime);
        echoGain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, echoTime + 0.02);
        echoGain.gain.exponentialRampToValueAtTime(0.001, echoTime + 0.3);
        
        echo.start(echoTime);
        echo.stop(echoTime + 0.3);
      });
    } catch (error) {
      console.error('Error playing quest accepted sound:', error);
    }
  }

  /**
   * 13. EMBARK/DISEMBARK SOUND - Higher pitched footstep
   */
  public playEmbarkSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Realistic footsteps on sand - using filtered white noise
      // First footstep
      const step1Duration = 0.25;
      const step1Buffer = ctx.createBuffer(1, ctx.sampleRate * step1Duration, ctx.sampleRate);
      const step1Data = step1Buffer.getChannelData(0);
      
      // Generate sand footstep texture
      for (let i = 0; i < step1Data.length; i++) {
        const t = i / ctx.sampleRate;
        
        // Base white noise for sand grains
        let sample = (Math.random() - 0.5) * 2;
        
        // Envelope that simulates foot pressure on sand
        const attack = Math.min(t * 40, 1); // Quick step down
        const sustain = t < 0.05 ? 1 : Math.exp(-(t - 0.05) * 8); // Brief pressure then decay
        const envelope = attack * sustain;
        
        // Low frequency thump for foot impact
        const thump = Math.sin(t * 2 * Math.PI * 70) * Math.exp(-t * 12) * 0.8;
        
        // Combine noise texture with impact thump
        sample = (sample * 0.6 + thump) * envelope * 0.25;
        
        step1Data[i] = sample;
      }
      
      const step1Source = ctx.createBufferSource();
      const step1Gain = ctx.createGain();
      const step1Filter = ctx.createBiquadFilter();
      
      step1Source.buffer = step1Buffer;
      step1Source.connect(step1Filter);
      step1Filter.connect(step1Gain);
      step1Gain.connect(ctx.destination);
      
      // Filter to make it sound like sand (remove sharp highs)
      step1Filter.type = 'lowpass';
      step1Filter.frequency.value = 2500;
      step1Filter.Q.value = 0.8;
      
      step1Gain.gain.setValueAtTime(0.7 * this.masterVolume, now);
      
      step1Source.start(now);
      step1Source.stop(now + step1Duration);
      
      // Second footstep with slight variation
      const step2Duration = 0.22;
      const step2Buffer = ctx.createBuffer(1, ctx.sampleRate * step2Duration, ctx.sampleRate);
      const step2Data = step2Buffer.getChannelData(0);
      
      for (let i = 0; i < step2Data.length; i++) {
        const t = i / ctx.sampleRate;
        
        // Slightly different noise pattern for variation
        let sample = (Math.random() - 0.5) * 1.8;
        
        // Different envelope timing
        const attack = Math.min(t * 35, 1);
        const sustain = t < 0.04 ? 1 : Math.exp(-(t - 0.04) * 10);
        const envelope = attack * sustain;
        
        // Slightly different thump frequency
        const thump = Math.sin(t * 2 * Math.PI * 85) * Math.exp(-t * 15) * 0.6;
        
        sample = (sample * 0.55 + thump) * envelope * 0.2;
        
        step2Data[i] = sample;
      }
      
      const step2Source = ctx.createBufferSource();
      const step2Gain = ctx.createGain();
      const step2Filter = ctx.createBiquadFilter();
      
      step2Source.buffer = step2Buffer;
      step2Source.connect(step2Filter);
      step2Filter.connect(step2Gain);
      step2Gain.connect(ctx.destination);
      
      step2Filter.type = 'lowpass';
      step2Filter.frequency.value = 2200;
      step2Filter.Q.value = 1;
      
      step2Gain.gain.setValueAtTime(0.5 * this.masterVolume, now + 0.28);
      
      step2Source.start(now + 0.28);
      step2Source.stop(now + 0.28 + step2Duration);
      
    } catch (error) {
      console.error('Error playing embark sound:', error);
    }
  }

  /**
   * 14. ROGUELIKE - Wall bump sound
   */
  public playWallBumpSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Low thud sound
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      const thudFilter = ctx.createBiquadFilter();
      
      thud.connect(thudFilter);
      thudFilter.connect(thudGain);
      thudGain.connect(ctx.destination);
      
      thud.frequency.value = 50;
      thud.type = 'sine';
      
      thudFilter.type = 'lowpass';
      thudFilter.frequency.value = 100;
      
      thudGain.gain.setValueAtTime(0.25 * this.masterVolume, now);
      thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      thud.start(now);
      thud.stop(now + 0.08);
      
      // Add a small click for stone impact
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      
      click.frequency.value = 200;
      click.type = 'triangle';
      
      clickGain.gain.setValueAtTime(0, now);
      clickGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.001);
      clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
      
      click.start(now);
      click.stop(now + 0.03);
      
    } catch (error) {
      console.error('Error playing wall bump sound:', error);
    }
  }

  /**
   * 15. ROGUELIKE - Gold pickup sound
   */
  public playGoldPickupSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Multiple ascending coin sounds for satisfying pickup
      const notes = [1800, 2200, 2600, 3000];
      notes.forEach((freq, i) => {
        const coin = ctx.createOscillator();
        const coinGain = ctx.createGain();
        const coinFilter = ctx.createBiquadFilter();
        
        coin.connect(coinFilter);
        coinFilter.connect(coinGain);
        coinGain.connect(ctx.destination);
        
        coin.frequency.value = freq;
        coin.type = 'triangle';
        
        coinFilter.type = 'highpass';
        coinFilter.frequency.value = 1500;
        coinFilter.Q.value = 15;
        
        const startTime = now + (i * 0.04);
        coinGain.gain.setValueAtTime(0, startTime);
        coinGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, startTime + 0.002);
        coinGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.15);
        
        coin.start(startTime);
        coin.stop(startTime + 0.15);
      });
      
    } catch (error) {
      console.error('Error playing gold pickup sound:', error);
    }
  }

  /**
   * 16. ROGUELIKE - Combat start sound
   */
  public playRoguelikeCombatSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Sword clash sound
      const clash = ctx.createOscillator();
      const clashGain = ctx.createGain();
      const clashFilter = ctx.createBiquadFilter();
      
      clash.connect(clashFilter);
      clashFilter.connect(clashGain);
      clashGain.connect(ctx.destination);
      
      clash.frequency.value = 800;
      clash.frequency.exponentialRampToValueAtTime(200, now + 0.1);
      clash.type = 'sawtooth';
      
      clashFilter.type = 'highpass';
      clashFilter.frequency.value = 600;
      clashFilter.Q.value = 5;
      
      clashGain.gain.setValueAtTime(0, now);
      clashGain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + 0.01);
      clashGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      clash.start(now);
      clash.stop(now + 0.2);
      
      // Metallic ring
      const ring = ctx.createOscillator();
      const ringGain = ctx.createGain();
      
      ring.connect(ringGain);
      ringGain.connect(ctx.destination);
      
      ring.frequency.value = 1600;
      ring.type = 'sine';
      
      ringGain.gain.setValueAtTime(0, now);
      ringGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.005);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      
      ring.start(now);
      ring.stop(now + 0.4);
      
    } catch (error) {
      console.error('Error playing roguelike combat sound:', error);
    }
  }

  /**
   * 17. ROGUELIKE - Attack/hit sound
   */
  public playRoguelikeAttackSound(hit: boolean = true) {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      if (hit) {
        // Impact sound
        const impact = ctx.createOscillator();
        const impactGain = ctx.createGain();
        
        impact.connect(impactGain);
        impactGain.connect(ctx.destination);
        
        impact.frequency.value = 80;
        impact.type = 'sawtooth';
        
        impactGain.gain.setValueAtTime(0.3 * this.masterVolume, now);
        impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        impact.start(now);
        impact.stop(now + 0.1);
        
        // Flesh hit sound (white noise burst)
        const hitBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const hitData = hitBuffer.getChannelData(0);
        for (let i = 0; i < hitData.length; i++) {
          hitData[i] = (Math.random() - 0.5) * 0.2 * Math.exp(-i / (ctx.sampleRate * 0.01));
        }
        
        const hitSource = ctx.createBufferSource();
        const hitGain = ctx.createGain();
        const hitFilter = ctx.createBiquadFilter();
        
        hitSource.buffer = hitBuffer;
        hitSource.connect(hitFilter);
        hitFilter.connect(hitGain);
        hitGain.connect(ctx.destination);
        
        hitFilter.type = 'lowpass';
        hitFilter.frequency.value = 500;
        
        hitGain.gain.value = 0.25 * this.masterVolume;
        
        hitSource.start(now);
      } else {
        // Miss/swish sound
        const swish = ctx.createOscillator();
        const swishGain = ctx.createGain();
        const swishFilter = ctx.createBiquadFilter();
        
        swish.connect(swishFilter);
        swishFilter.connect(swishGain);
        swishGain.connect(ctx.destination);
        
        swish.frequency.value = 100;
        swish.frequency.exponentialRampToValueAtTime(50, now + 0.1);
        swish.type = 'sawtooth';
        
        swishFilter.type = 'bandpass';
        swishFilter.frequency.value = 200;
        swishFilter.Q.value = 2;
        
        swishGain.gain.setValueAtTime(0, now);
        swishGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.02);
        swishGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        swish.start(now);
        swish.stop(now + 0.1);
      }
      
    } catch (error) {
      console.error('Error playing roguelike attack sound:', error);
    }
  }

  /**
   * 18. ROGUELIKE - Footstep sound
   */
  public playRoguelikeFootstepSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Very subtle footstep
      const step = ctx.createOscillator();
      const stepGain = ctx.createGain();
      const stepFilter = ctx.createBiquadFilter();
      
      step.connect(stepFilter);
      stepFilter.connect(stepGain);
      stepGain.connect(ctx.destination);
      
      step.frequency.value = 40 + Math.random() * 20; // Slight variation
      step.type = 'sine';
      
      stepFilter.type = 'lowpass';
      stepFilter.frequency.value = 80;
      
      stepGain.gain.setValueAtTime(0.08 * this.masterVolume, now);
      stepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      
      step.start(now);
      step.stop(now + 0.05);
      
    } catch (error) {
      console.error('Error playing roguelike footstep sound:', error);
    }
  }

  /**
   * 19. ROGUELIKE - Stairs sound
   */
  public playStairsSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Multiple stone steps sound
      for (let i = 0; i < 3; i++) {
        const step = ctx.createOscillator();
        const stepGain = ctx.createGain();
        const stepFilter = ctx.createBiquadFilter();
        
        step.connect(stepFilter);
        stepFilter.connect(stepGain);
        stepGain.connect(ctx.destination);
        
        step.frequency.value = 100 + (i * 50);
        step.type = 'triangle';
        
        stepFilter.type = 'lowpass';
        stepFilter.frequency.value = 200;
        
        const startTime = now + (i * 0.1);
        stepGain.gain.setValueAtTime(0.1 * this.masterVolume, startTime);
        stepGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
        
        step.start(startTime);
        step.stop(startTime + 0.08);
      }
      
      // Ambient echo
      const echo = ctx.createOscillator();
      const echoGain = ctx.createGain();
      const echoFilter = ctx.createBiquadFilter();
      
      echo.connect(echoFilter);
      echoFilter.connect(echoGain);
      echoGain.connect(ctx.destination);
      
      echo.frequency.value = 200;
      echo.type = 'sine';
      
      echoFilter.type = 'lowpass';
      echoFilter.frequency.value = 400;
      echoFilter.Q.value = 10;
      
      echoGain.gain.setValueAtTime(0, now + 0.2);
      echoGain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, now + 0.3);
      echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      echo.start(now + 0.2);
      echo.stop(now + 0.8);
      
    } catch (error) {
      console.error('Error playing stairs sound:', error);
    }
  }

  /**
   * 20. HEALING SOUND
   */
  public playHealingSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Soothing ascending tones
      const healNotes = [261.63, 329.63, 392.00, 440.00, 523.25]; // C-E-G-A-C
      healNotes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sine';
        
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        
        const startTime = now + (i * 0.08);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
        
        osc.start(startTime);
        osc.stop(startTime + 0.8);
      });
      
      // Add a soft shimmer
      const shimmer = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      
      shimmer.frequency.value = 2093; // C7
      shimmer.type = 'sine';
      
      shimmerGain.gain.setValueAtTime(0, now + 0.3);
      shimmerGain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, now + 0.4);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 1);
      
      shimmer.start(now + 0.3);
      shimmer.stop(now + 1);
    } catch (error) {
      console.error('Error playing healing sound:', error);
    }
  }
  /**
   * ROGUELIKE-SPECIFIC: Attack sound with hit/miss variation
   */
  public playRoguelikeAttackSound(hit: boolean) {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      if (hit) {
        // Hit sound - sharp metallic impact
        const impact = ctx.createOscillator();
        const impactGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        impact.connect(filter);
        filter.connect(impactGain);
        impactGain.connect(ctx.destination);
        
        // Metallic clang
        impact.type = 'sawtooth';
        impact.frequency.setValueAtTime(800, now);
        impact.frequency.exponentialRampToValueAtTime(200, now + 0.05);
        
        filter.type = 'highpass';
        filter.frequency.value = 400;
        filter.Q.value = 5;
        
        impactGain.gain.setValueAtTime(0.2 * this.masterVolume, now);
        impactGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        impact.start(now);
        impact.stop(now + 0.1);
        
        // Add a brief white noise for texture
        const noise = this.createWhiteNoise(ctx);
        const noiseGain = ctx.createGain();
        
        noise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        noiseGain.gain.setValueAtTime(0.15 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        
        noise.start(now);
        noise.stop(now + 0.03);
      } else {
        // Miss sound - whoosh
        const whoosh = ctx.createOscillator();
        const whooshGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        whoosh.connect(filter);
        filter.connect(whooshGain);
        whooshGain.connect(ctx.destination);
        
        whoosh.type = 'sine';
        whoosh.frequency.setValueAtTime(400, now);
        whoosh.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);
        
        whooshGain.gain.setValueAtTime(0, now);
        whooshGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.02);
        whooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        whoosh.start(now);
        whoosh.stop(now + 0.15);
      }
    } catch (error) {
      console.error('Error playing attack sound:', error);
    }
  }

  /**
   * ROGUELIKE-SPECIFIC: Enemy defeat sound
   */
  public playEnemyDefeatSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Descending glissando with echo
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const delay = ctx.createDelay(0.3);
      const delayGain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.connect(delay);
      delay.connect(delayGain);
      delayGain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);
      
      gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      delay.delayTime.value = 0.1;
      delayGain.gain.value = 0.3 * this.masterVolume;
      
      osc.start(now);
      osc.stop(now + 0.4);
      
      // Victory sparkle
      setTimeout(() => {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();
        
        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);
        
        sparkle.type = 'sine';
        sparkle.frequency.value = 1318.51; // E6
        
        sparkleGain.gain.setValueAtTime(0, ctx.currentTime);
        sparkleGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, ctx.currentTime + 0.05);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        sparkle.start(ctx.currentTime);
        sparkle.stop(ctx.currentTime + 0.2);
      }, 200);
    } catch (error) {
      console.error('Error playing defeat sound:', error);
    }
  }

  /**
   * ROGUELIKE-SPECIFIC: Trap trigger sound
   */
  public playTrapSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Mechanical spring release
      const spring = ctx.createOscillator();
      const springGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      spring.connect(filter);
      filter.connect(springGain);
      springGain.connect(ctx.destination);
      
      spring.type = 'sawtooth';
      spring.frequency.setValueAtTime(100, now);
      spring.frequency.linearRampToValueAtTime(300, now + 0.02);
      spring.frequency.exponentialRampToValueAtTime(50, now + 0.1);
      
      filter.type = 'bandpass';
      filter.frequency.value = 200;
      filter.Q.value = 10;
      
      springGain.gain.setValueAtTime(0.2 * this.masterVolume, now);
      springGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      spring.start(now);
      spring.stop(now + 0.15);
      
      // Sharp snap
      setTimeout(() => {
        const snap = this.createWhiteNoise(ctx);
        const snapGain = ctx.createGain();
        const snapFilter = ctx.createBiquadFilter();
        
        snap.connect(snapFilter);
        snapFilter.connect(snapGain);
        snapGain.connect(ctx.destination);
        
        snapFilter.type = 'highpass';
        snapFilter.frequency.value = 3000;
        
        snapGain.gain.setValueAtTime(0.25 * this.masterVolume, ctx.currentTime);
        snapGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.02);
        
        snap.start(ctx.currentTime);
        snap.stop(ctx.currentTime + 0.02);
      }, 20);
    } catch (error) {
      console.error('Error playing trap sound:', error);
    }
  }

  /**
   * ROGUELIKE-SPECIFIC: Manuscript discovery sound
   */
  public playManuscriptSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Mystical ascending arpeggio with reverb
      const notes = [261.63, 311.13, 392.00, 466.16, 523.25]; // C-Eb-G-Bb-C (mystical scale)
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const delay = ctx.createDelay(0.5);
        const delayGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        gain.connect(delay);
        delay.connect(delayGain);
        delayGain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 3;
        
        const startTime = now + (i * 0.1);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, startTime + 0.05);
        gain.gain.setValueAtTime(0.08 * this.masterVolume, startTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);
        
        delay.delayTime.value = 0.2;
        delayGain.gain.value = 0.3 * this.masterVolume;
        
        osc.start(startTime);
        osc.stop(startTime + 0.6);
      });
      
      // Add paper rustle
      const rustle = this.createWhiteNoise(ctx);
      const rustleGain = ctx.createGain();
      const rustleFilter = ctx.createBiquadFilter();
      
      rustle.connect(rustleFilter);
      rustleFilter.connect(rustleGain);
      rustleGain.connect(ctx.destination);
      
      rustleFilter.type = 'bandpass';
      rustleFilter.frequency.value = 4000;
      rustleFilter.Q.value = 5;
      
      rustleGain.gain.setValueAtTime(0, now);
      rustleGain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, now + 0.05);
      rustleGain.gain.setValueAtTime(0.05 * this.masterVolume, now + 0.1);
      rustleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      rustle.start(now);
      rustle.stop(now + 0.3);
    } catch (error) {
      console.error('Error playing manuscript sound:', error);
    }
  }

  /**
   * ROGUELIKE-SPECIFIC: Torch pickup sound
   */
  public playTorchSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Whoosh of flame igniting
      const noise = this.createWhiteNoise(ctx);
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(200, now);
      filter.frequency.linearRampToValueAtTime(800, now + 0.1);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.3);
      filter.Q.value = 2;
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.05);
      noiseGain.gain.setValueAtTime(0.1 * this.masterVolume, now + 0.1);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      noise.start(now);
      noise.stop(now + 0.4);
      
      // Add a brief crackle
      const crackle = ctx.createOscillator();
      const crackleGain = ctx.createGain();
      
      crackle.connect(crackleGain);
      crackleGain.connect(ctx.destination);
      
      crackle.type = 'square';
      crackle.frequency.value = 60;
      
      crackleGain.gain.setValueAtTime(0.03 * this.masterVolume, now + 0.1);
      crackleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      crackle.start(now + 0.1);
      crackle.stop(now + 0.2);
    } catch (error) {
      console.error('Error playing torch sound:', error);
    }
  }

  /**
   * UI: Satisfying button click for bottom panel actions
   */
  public playButtonClickSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Crisp click with two tones
      const click1 = ctx.createOscillator();
      const click2 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();
      
      click1.connect(gain1);
      click2.connect(gain2);
      gain1.connect(ctx.destination);
      gain2.connect(ctx.destination);
      
      // First click - higher pitch
      click1.type = 'sine';
      click1.frequency.value = 800;
      
      // Second click - lower pitch (makes it more satisfying)
      click2.type = 'sine';
      click2.frequency.value = 600;
      
      // Quick attack and decay
      gain1.gain.setValueAtTime(0.1 * this.masterVolume, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
      
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.08 * this.masterVolume, now + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      
      click1.start(now);
      click1.stop(now + 0.02);
      click2.start(now + 0.01);
      click2.stop(now + 0.04);
      
      // Add a tiny bit of white noise for texture
      const noise = this.createWhiteNoise(ctx);
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      filter.type = 'highpass';
      filter.frequency.value = 5000;
      
      noiseGain.gain.setValueAtTime(0.02 * this.masterVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.01);
      
      noise.start(now);
      noise.stop(now + 0.01);
    } catch (error) {
      console.error('Error playing button click sound:', error);
    }
  }

  /**
   * UI: Mysterious piano figure for Enter Ruins
   */
  public playMysteriousRuinsSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Mysterious minor chord arpeggio with sustain
      const notes = [
        { freq: 220.00, time: 0 },      // A3
        { freq: 261.63, time: 0.08 },   // C4
        { freq: 329.63, time: 0.16 },   // E4
        { freq: 349.23, time: 0.24 },   // F4
        { freq: 329.63, time: 0.32 },   // E4
        { freq: 261.63, time: 0.40 },   // C4
      ];
      
      notes.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        // Piano-like tone
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        // Mild filtering for warmth
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;
        
        const startTime = now + time;
        
        // Piano-like envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.03 * this.masterVolume, startTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
        
        osc.start(startTime);
        osc.stop(startTime + 0.8);
        
        // Add harmonics for richness
        const harmonic = ctx.createOscillator();
        const harmonicGain = ctx.createGain();
        
        harmonic.connect(harmonicGain);
        harmonicGain.connect(ctx.destination);
        
        harmonic.type = 'sine';
        harmonic.frequency.value = freq * 2;
        
        harmonicGain.gain.setValueAtTime(0, startTime);
        harmonicGain.gain.linearRampToValueAtTime(0.02 * this.masterVolume, startTime + 0.01);
        harmonicGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        harmonic.start(startTime);
        harmonic.stop(startTime + 0.5);
      });
      
      // Add reverb-like delay
      const reverb = ctx.createDelay(0.5);
      const reverbGain = ctx.createGain();
      const reverbFilter = ctx.createBiquadFilter();
      
      reverb.connect(reverbFilter);
      reverbFilter.connect(reverbGain);
      reverbGain.connect(ctx.destination);
      
      reverb.delayTime.value = 0.3;
      reverbGain.gain.value = 0.2 * this.masterVolume;
      
      reverbFilter.type = 'lowpass';
      reverbFilter.frequency.value = 1000;
    } catch (error) {
      console.error('Error playing mysterious ruins sound:', error);
    }
  }

  /**
   * FISHING: Plop sound for casting line
   */
  public playFishingCastSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Water plop - sine wave with quick pitch drop
      const plop = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      plop.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      plop.type = 'sine';
      plop.frequency.setValueAtTime(400, now);
      plop.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      
      // Low pass for water-like quality
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      filter.Q.value = 5;
      
      gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      plop.start(now);
      plop.stop(now + 0.2);
      
      // Add water splash noise
      const splash = this.createWhiteNoise(ctx);
      const splashGain = ctx.createGain();
      const splashFilter = ctx.createBiquadFilter();
      
      splash.connect(splashFilter);
      splashFilter.connect(splashGain);
      splashGain.connect(ctx.destination);
      
      splashFilter.type = 'bandpass';
      splashFilter.frequency.value = 300;
      splashFilter.Q.value = 2;
      
      splashGain.gain.setValueAtTime(0.1 * this.masterVolume, now);
      splashGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      splash.start(now);
      splash.stop(now + 0.15);
    } catch (error) {
      console.error('Error playing fishing cast sound:', error);
    }
  }

  /**
   * FISHING: Nibble alert sound (like Stardew Valley)
   */
  public playFishingNibbleSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Quick "dib dib dib dib" pattern
      const dibTimes = [0, 0.08, 0.16, 0.24];
      
      dibTimes.forEach((time) => {
        const dib = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        dib.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        // Soft, muted tone
        dib.type = 'sine';
        dib.frequency.value = 600;
        
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;
        
        const startTime = now + time;
        
        // Very quick, soft attack
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.06 * this.masterVolume, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
        
        dib.start(startTime);
        dib.stop(startTime + 0.05);
        
        // Add a subtle underwater resonance
        const resonance = ctx.createOscillator();
        const resGain = ctx.createGain();
        
        resonance.connect(resGain);
        resGain.connect(ctx.destination);
        
        resonance.type = 'sine';
        resonance.frequency.value = 300;
        
        resGain.gain.setValueAtTime(0.02 * this.masterVolume, startTime);
        resGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.03);
        
        resonance.start(startTime);
        resonance.stop(startTime + 0.03);
      });
    } catch (error) {
      console.error('Error playing fishing nibble sound:', error);
    }
  }

  /**
   * FISHING: Fish bite sound (bigger plop)
   */
  public playFishingBiteSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Bigger, more impactful plop
      const bite = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      bite.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      bite.type = 'sine';
      bite.frequency.setValueAtTime(500, now);
      bite.frequency.exponentialRampToValueAtTime(80, now + 0.15);
      
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      filter.Q.value = 8;
      
      gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
      gain.gain.setValueAtTime(0.15 * this.masterVolume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      bite.start(now);
      bite.stop(now + 0.3);
      
      // Bigger splash
      const splash = this.createWhiteNoise(ctx);
      const splashGain = ctx.createGain();
      const splashFilter = ctx.createBiquadFilter();
      
      splash.connect(splashFilter);
      splashFilter.connect(splashGain);
      splashGain.connect(ctx.destination);
      
      splashFilter.type = 'bandpass';
      splashFilter.frequency.setValueAtTime(400, now);
      splashFilter.frequency.linearRampToValueAtTime(200, now + 0.2);
      splashFilter.Q.value = 3;
      
      splashGain.gain.setValueAtTime(0.15 * this.masterVolume, now);
      splashGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      splash.start(now);
      splash.stop(now + 0.25);
      
      // Add a subtle "gulp" undertone
      const gulp = ctx.createOscillator();
      const gulpGain = ctx.createGain();
      
      gulp.connect(gulpGain);
      gulpGain.connect(ctx.destination);
      
      gulp.type = 'sine';
      gulp.frequency.setValueAtTime(150, now + 0.05);
      gulp.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      
      gulpGain.gain.setValueAtTime(0, now);
      gulpGain.gain.setValueAtTime(0.08 * this.masterVolume, now + 0.05);
      gulpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      gulp.start(now + 0.05);
      gulp.stop(now + 0.2);
    } catch (error) {
      console.error('Error playing fishing bite sound:', error);
    }
  }

  /**
   * ROGUELIKE-SPECIFIC: Footstep sound
   */
  public playFootstepSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Create a subtle footstep using filtered noise
      const step = this.createWhiteNoise(ctx);
      const stepGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      step.connect(filter);
      filter.connect(stepGain);
      stepGain.connect(ctx.destination);
      
      // Low frequency thud
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 1;
      
      // Very short and quiet
      stepGain.gain.setValueAtTime(0.05 * this.masterVolume, now);
      stepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      
      step.start(now);
      step.stop(now + 0.05);
      
      // Add a tiny bit of low frequency thump
      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      
      thump.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      
      thump.type = 'sine';
      thump.frequency.value = 60;
      
      thumpGain.gain.setValueAtTime(0.03 * this.masterVolume, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
      
      thump.start(now);
      thump.stop(now + 0.03);
    } catch (error) {
      console.error('Error playing footstep sound:', error);
    }
  }

  /**
   * ROGUELIKE-SPECIFIC: Altar interaction sound
   */
  public playAltarSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Deep resonant hum with harmonics
      const fundamental = 65.41; // Low C
      const harmonics = [1, 2, 3, 5, 7]; // Mystical harmonics
      
      harmonics.forEach((harmonic, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const panner = ctx.createStereoPanner();
        
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = fundamental * harmonic;
        
        // Slight stereo spread for mystical effect
        panner.pan.value = (i % 2 === 0 ? -0.3 : 0.3) * (i / harmonics.length);
        
        const amplitude = 0.1 * this.masterVolume / (harmonic * 0.5);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(amplitude, now + 0.3);
        gain.gain.setValueAtTime(amplitude, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        
        osc.start(now);
        osc.stop(now + 1.5);
      });
      
      // Add ethereal bell
      setTimeout(() => {
        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();
        const bellFilter = ctx.createBiquadFilter();
        
        bell.connect(bellFilter);
        bellFilter.connect(bellGain);
        bellGain.connect(ctx.destination);
        
        bell.type = 'sine';
        bell.frequency.value = 1046.50; // High C
        
        bellFilter.type = 'lowpass';
        bellFilter.frequency.value = 3000;
        bellFilter.Q.value = 10;
        
        bellGain.gain.setValueAtTime(0.05 * this.masterVolume, ctx.currentTime);
        bellGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        
        bell.start(ctx.currentTime);
        bell.stop(ctx.currentTime + 0.8);
      }, 300);
    } catch (error) {
      console.error('Error playing altar sound:', error);
    }
  }

  /**
   * OCEAN AMBIENCE - Continuous gentle water lapping sound for boat travel
   * Returns the gain node so volume can be controlled or sound can be stopped
   */
  public startOceanAmbience(): { stop: () => void; setVolume: (volume: number) => void } | null {
    if (this.isMuted) return null;
    const ctx = this.ensureAudioContext();
    if (!ctx) return null;

    try {
      const now = ctx.currentTime;
      
      // Create gentle water swishing with filtered white noise
      const oceanBuffer = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate); // 4 second loop
      const oceanData = oceanBuffer.getChannelData(0);
      
      // Generate organic wave-like noise
      for (let i = 0; i < oceanData.length; i++) {
        const t = i / ctx.sampleRate;
        // Layer multiple sine waves to create organic water sound
        const wave1 = Math.sin(t * Math.PI * 0.5) * 0.3; // Very slow wave
        const wave2 = Math.sin(t * Math.PI * 1.2) * 0.2; // Medium wave  
        const wave3 = Math.sin(t * Math.PI * 2.8) * 0.1; // Faster ripple
        
        // Add filtered white noise for texture
        const noise = (Math.random() - 0.5) * 0.15 * (wave1 + wave2 + wave3 + 0.5);
        oceanData[i] = noise;
      }
      
      const oceanSource = ctx.createBufferSource();
      const oceanGain = ctx.createGain();
      const oceanFilter = ctx.createBiquadFilter();
      const oceanFilter2 = ctx.createBiquadFilter();
      
      oceanSource.buffer = oceanBuffer;
      oceanSource.loop = true; // Loop continuously
      oceanSource.connect(oceanFilter);
      oceanFilter.connect(oceanFilter2);
      oceanFilter2.connect(oceanGain);
      oceanGain.connect(ctx.destination);
      
      // Filter for water-like quality
      oceanFilter.type = 'lowpass';
      oceanFilter.frequency.value = 400;
      oceanFilter.Q.value = 2;
      
      oceanFilter2.type = 'highpass';
      oceanFilter2.frequency.value = 80;
      oceanFilter2.Q.value = 1;
      
      // Start very quietly
      oceanGain.gain.setValueAtTime(0, now);
      oceanGain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, now + 2);
      
      oceanSource.start(now);
      
      // Add subtle low-frequency boat creaking
      const creakSource = ctx.createBufferSource();
      const creakGain = ctx.createGain();
      const creakFilter = ctx.createBiquadFilter();
      
      // Create subtle wood creaking buffer
      const creakBuffer = ctx.createBuffer(1, ctx.sampleRate * 6, ctx.sampleRate);
      const creakData = creakBuffer.getChannelData(0);
      
      for (let i = 0; i < creakData.length; i++) {
        const t = i / ctx.sampleRate;
        // Very subtle periodic creaking
        const creak = Math.sin(t * Math.PI * 0.3) * 0.05 * (Math.random() - 0.5);
        creakData[i] = creak;
      }
      
      creakSource.buffer = creakBuffer;
      creakSource.loop = true;
      creakSource.connect(creakFilter);
      creakFilter.connect(creakGain);
      creakGain.connect(ctx.destination);
      
      creakFilter.type = 'lowpass';
      creakFilter.frequency.value = 200;
      creakFilter.Q.value = 5;
      
      creakGain.gain.setValueAtTime(0, now);
      creakGain.gain.linearRampToValueAtTime(0.03 * this.masterVolume, now + 3);
      
      creakSource.start(now + 1);
      
      // Return control object
      let isActive = true;
      
      return {
        stop: () => {
          if (!isActive) return;
          isActive = false;
          
          const fadeTime = ctx.currentTime + 1.5;
          oceanGain.gain.linearRampToValueAtTime(0, fadeTime);
          creakGain.gain.linearRampToValueAtTime(0, fadeTime);
          
          setTimeout(() => {
            try {
              oceanSource.stop();
              creakSource.stop();
            } catch (e) {
              // Sources may already be stopped
            }
          }, 1600);
        },
        
        setVolume: (volume: number) => {
          if (!isActive) return;
          const clampedVolume = Math.max(0, Math.min(1, volume));
          oceanGain.gain.setValueAtTime(clampedVolume * 0.08 * this.masterVolume, ctx.currentTime);
          creakGain.gain.setValueAtTime(clampedVolume * 0.03 * this.masterVolume, ctx.currentTime);
        }
      };
      
    } catch (error) {
      console.error('Error starting ocean ambience:', error);
      return null;
    }
  }

  /**
   * CONTAINER - Opening sound for chests, barrels, etc.
   */
  public playContainerOpenSound(containerType: 'chest' | 'barrel' | 'cabinet' | 'generic' = 'generic') {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Different sounds based on container type
      if (containerType === 'chest') {
        // Wooden chest opening - hinge creak + lid thud
        const creak = ctx.createOscillator();
        const creakGain = ctx.createGain();
        const creakFilter = ctx.createBiquadFilter();
        
        creak.connect(creakFilter);
        creakFilter.connect(creakGain);
        creakGain.connect(ctx.destination);
        
        creak.type = 'sawtooth';
        creak.frequency.setValueAtTime(180, now);
        creak.frequency.linearRampToValueAtTime(220, now + 0.1);
        creak.frequency.linearRampToValueAtTime(200, now + 0.25);
        
        creakFilter.type = 'lowpass';
        creakFilter.frequency.value = 400;
        creakFilter.Q.value = 3;
        
        creakGain.gain.setValueAtTime(0, now);
        creakGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 0.05);
        creakGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        creak.start(now);
        creak.stop(now + 0.3);
        
        // Lid settling thud
        const thud = ctx.createOscillator();
        const thudGain = ctx.createGain();
        
        thud.connect(thudGain);
        thudGain.connect(ctx.destination);
        
        thud.type = 'sine';
        thud.frequency.value = 80;
        
        thudGain.gain.setValueAtTime(0.08 * this.masterVolume, now + 0.2);
        thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        
        thud.start(now + 0.2);
        thud.stop(now + 0.35);
        
      } else if (containerType === 'barrel') {
        // Barrel opening - cork pop + hollow resonance
        const pop = this.createWhiteNoise(ctx);
        const popGain = ctx.createGain();
        const popFilter = ctx.createBiquadFilter();
        
        pop.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(ctx.destination);
        
        popFilter.type = 'highpass';
        popFilter.frequency.value = 1000;
        popFilter.Q.value = 5;
        
        popGain.gain.setValueAtTime(0.15 * this.masterVolume, now);
        popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        pop.start(now);
        pop.stop(now + 0.05);
        
        // Hollow resonance
        const resonance = ctx.createOscillator();
        const resGain = ctx.createGain();
        const resFilter = ctx.createBiquadFilter();
        
        resonance.connect(resFilter);
        resFilter.connect(resGain);
        resGain.connect(ctx.destination);
        
        resonance.type = 'sine';
        resonance.frequency.value = 120;
        resonance.frequency.exponentialRampToValueAtTime(100, now + 0.2);
        
        resFilter.type = 'bandpass';
        resFilter.frequency.value = 200;
        resFilter.Q.value = 8;
        
        resGain.gain.setValueAtTime(0, now + 0.03);
        resGain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, now + 0.08);
        resGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        
        resonance.start(now + 0.03);
        resonance.stop(now + 0.3);
        
      } else if (containerType === 'cabinet') {
        // Cabinet/drawer slide open
        const slide = this.createWhiteNoise(ctx);
        const slideGain = ctx.createGain();
        const slideFilter = ctx.createBiquadFilter();
        
        slide.connect(slideFilter);
        slideFilter.connect(slideGain);
        slideGain.connect(ctx.destination);
        
        slideFilter.type = 'bandpass';
        slideFilter.frequency.setValueAtTime(300, now);
        slideFilter.frequency.linearRampToValueAtTime(400, now + 0.15);
        slideFilter.Q.value = 3;
        
        slideGain.gain.setValueAtTime(0, now);
        slideGain.gain.linearRampToValueAtTime(0.06 * this.masterVolume, now + 0.02);
        slideGain.gain.setValueAtTime(0.06 * this.masterVolume, now + 0.12);
        slideGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        
        slide.start(now);
        slide.stop(now + 0.18);
        
        // Soft click at end
        const click = ctx.createOscillator();
        const clickGain = ctx.createGain();
        
        click.connect(clickGain);
        clickGain.connect(ctx.destination);
        
        click.type = 'sine';
        click.frequency.value = 600;
        
        clickGain.gain.setValueAtTime(0.04 * this.masterVolume, now + 0.15);
        clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        
        click.start(now + 0.15);
        click.stop(now + 0.18);
        
      } else {
        // Generic container opening
        const open = ctx.createOscillator();
        const openGain = ctx.createGain();
        const openFilter = ctx.createBiquadFilter();
        
        open.connect(openFilter);
        openFilter.connect(openGain);
        openGain.connect(ctx.destination);
        
        open.type = 'triangle';
        open.frequency.setValueAtTime(200, now);
        open.frequency.linearRampToValueAtTime(250, now + 0.1);
        
        openFilter.type = 'lowpass';
        openFilter.frequency.value = 500;
        openFilter.Q.value = 2;
        
        openGain.gain.setValueAtTime(0, now);
        openGain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, now + 0.05);
        openGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        open.start(now);
        open.stop(now + 0.2);
      }
      
    } catch (error) {
      console.error('Error playing container open sound:', error);
    }
  }

  /**
   * CONTAINER - Closing sound for chests, barrels, etc.
   */
  public playContainerCloseSound(containerType: 'chest' | 'barrel' | 'cabinet' | 'generic' = 'generic') {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      if (containerType === 'chest') {
        // Chest closing - reverse of opening, softer
        const close = ctx.createOscillator();
        const closeGain = ctx.createGain();
        const closeFilter = ctx.createBiquadFilter();
        
        close.connect(closeFilter);
        closeFilter.connect(closeGain);
        closeGain.connect(ctx.destination);
        
        close.type = 'triangle';
        close.frequency.setValueAtTime(220, now);
        close.frequency.linearRampToValueAtTime(180, now + 0.15);
        
        closeFilter.type = 'lowpass';
        closeFilter.frequency.value = 350;
        closeFilter.Q.value = 2;
        
        closeGain.gain.setValueAtTime(0, now);
        closeGain.gain.linearRampToValueAtTime(0.06 * this.masterVolume, now + 0.03);
        closeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        
        close.start(now);
        close.stop(now + 0.2);
        
        // Final click/latch
        const latch = ctx.createOscillator();
        const latchGain = ctx.createGain();
        
        latch.connect(latchGain);
        latchGain.connect(ctx.destination);
        
        latch.type = 'sine';
        latch.frequency.value = 400;
        
        latchGain.gain.setValueAtTime(0.05 * this.masterVolume, now + 0.18);
        latchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        
        latch.start(now + 0.18);
        latch.stop(now + 0.22);
        
      } else {
        // Generic closing sound - simpler than opening
        const close = ctx.createOscillator();
        const closeGain = ctx.createGain();
        
        close.connect(closeGain);
        closeGain.connect(ctx.destination);
        
        close.type = 'sine';
        close.frequency.setValueAtTime(300, now);
        close.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        closeGain.gain.setValueAtTime(0.04 * this.masterVolume, now);
        closeGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        
        close.start(now);
        close.stop(now + 0.12);
      }
      
    } catch (error) {
      console.error('Error playing container close sound:', error);
    }
  }

  /**
   * SHIP - Subtle water splash for ship movement
   */
  public playShipMovementSplash() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Main splash - create a rich water sound with white noise
      const splash = this.createWhiteNoise(ctx);
      const splashGain = ctx.createGain();
      const splashFilter = ctx.createBiquadFilter();
      const splashFilter2 = ctx.createBiquadFilter();
      const splashFilter3 = ctx.createBiquadFilter();

      splash.connect(splashFilter);
      splashFilter.connect(splashFilter2);
      splashFilter2.connect(splashFilter3);
      splashFilter3.connect(splashGain);
      splashGain.connect(ctx.destination);

      // Multiple filters for more liquid, water-like quality
      splashFilter.type = 'bandpass';
      splashFilter.frequency.value = 450;  // Lower frequency for deeper water
      splashFilter.Q.value = 0.5;
      splashFilter.frequency.linearRampToValueAtTime(250, now + 0.2);  // Longer descent for water flow

      splashFilter2.type = 'lowpass';
      splashFilter2.frequency.value = 900;  // More muffled for underwater quality
      splashFilter2.Q.value = 0.3;

      // Add resonance for "wet" quality
      splashFilter3.type = 'peaking';
      splashFilter3.frequency.value = 350;
      splashFilter3.Q.value = 2;
      splashFilter3.gain.value = 3;

      // Longer, more complex envelope for realistic water splash
      splashGain.gain.setValueAtTime(0, now);
      splashGain.gain.linearRampToValueAtTime(0.06 * this.masterVolume, now + 0.015);  // Quick attack
      splashGain.gain.setValueAtTime(0.05 * this.masterVolume, now + 0.08);
      splashGain.gain.linearRampToValueAtTime(0.03 * this.masterVolume, now + 0.15);
      splashGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);  // Longer tail

      splash.start(now);
      splash.stop(now + 0.25);

      // Secondary water movement (ripples and drips)
      const ripple = this.createWhiteNoise(ctx);
      const rippleGain = ctx.createGain();
      const rippleFilter = ctx.createBiquadFilter();
      const rippleFilter2 = ctx.createBiquadFilter();

      ripple.connect(rippleFilter);
      rippleFilter.connect(rippleFilter2);
      rippleFilter2.connect(rippleGain);
      rippleGain.connect(ctx.destination);

      // Higher frequency for surface ripples
      rippleFilter.type = 'bandpass';
      rippleFilter.frequency.value = 800;
      rippleFilter.Q.value = 0.7;
      rippleFilter.frequency.exponentialRampToValueAtTime(200, now + 0.2);

      rippleFilter2.type = 'highpass';
      rippleFilter2.frequency.value = 150;
      rippleFilter2.Q.value = 0.5;

      rippleGain.gain.setValueAtTime(0, now + 0.02);
      rippleGain.gain.linearRampToValueAtTime(0.025 * this.masterVolume, now + 0.04);
      rippleGain.gain.setValueAtTime(0.02 * this.masterVolume, now + 0.1);
      rippleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      ripple.start(now + 0.02);
      ripple.stop(now + 0.18);

      // Third layer - water droplets falling back
      const droplets = this.createWhiteNoise(ctx);
      const dropletsGain = ctx.createGain();
      const dropletsFilter = ctx.createBiquadFilter();

      droplets.connect(dropletsFilter);
      dropletsFilter.connect(dropletsGain);
      dropletsGain.connect(ctx.destination);

      dropletsFilter.type = 'bandpass';
      dropletsFilter.frequency.value = 1200;
      dropletsFilter.Q.value = 3;

      // Delayed droplets for trailing water effect
      dropletsGain.gain.setValueAtTime(0, now + 0.08);
      dropletsGain.gain.setValueAtTime(0.015 * this.masterVolume, now + 0.12);
      dropletsGain.gain.setValueAtTime(0.01 * this.masterVolume, now + 0.16);
      dropletsGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      droplets.start(now + 0.08);
      droplets.stop(now + 0.22);

    } catch (error) {
      console.error('Error playing ship movement splash:', error);
    }
  }

  // Helper to create white noise
  private createWhiteNoise(ctx: AudioContext): AudioBufferSourceNode {
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    
    return whiteNoise;
  }

  /**
   * DEATH SOUND - Player death effect
   */
  public playDeathSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Descending tone for death
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 1.5);
      osc.type = 'sawtooth';
      
      gain.gain.setValueAtTime(0.3 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      
      osc.start(now);
      osc.stop(now + 1.5);
      
    } catch (error) {
      console.error('Error playing death sound:', error);
    }
  }

  /**
   * MENU OPEN SOUND - UI menu opening
   */
  public playMenuOpenSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.1);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.15);
      
    } catch (error) {
      console.error('Error playing menu open sound:', error);
    }
  }

  /**
   * MENU CLOSE SOUND - UI menu closing
   */
  public playMenuCloseSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.1);
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0.1 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.1);
      
    } catch (error) {
      console.error('Error playing menu close sound:', error);
    }
  }

  /**
   * ITEM DROP SOUND - Dropping an item
   */
  public playItemDropSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Low thud for item hitting ground
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = 120;
      osc.type = 'triangle';
      
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      
      gain.gain.setValueAtTime(0.2 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      osc.start(now);
      osc.stop(now + 0.2);
      
    } catch (error) {
      console.error('Error playing item drop sound:', error);
    }
  }

  /**
   * RAIN SOUND - Loopable rain effect
   */
  public playRainSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 10; // 10 seconds for looping
      
      // Create rain buffer - continuous white noise filtered to sound like rain
      const rainBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const rainData = rainBuffer.getChannelData(0);
      
      for (let i = 0; i < rainBuffer.length; i++) {
        const t = i / ctx.sampleRate;
        
        // Base white noise for rain texture
        let sample = (Math.random() - 0.5) * 2;
        
        // Add some variation in intensity (subtle wind gusts)
        const windVariation = 0.7 + 0.3 * Math.sin(t * 0.3) * Math.sin(t * 0.13);
        
        // Add occasional droplet emphasis
        const dropletChance = Math.random();
        if (dropletChance < 0.001) { // Rare emphasized droplets
          sample += Math.sin(t * 2 * Math.PI * (800 + Math.random() * 400)) * 
                   Math.exp(-((i % (ctx.sampleRate * 0.1)) / (ctx.sampleRate * 0.02))) * 0.5;
        }
        
        rainData[i] = sample * windVariation * 0.3;
      }
      
      const rainSource = ctx.createBufferSource();
      const rainGain = ctx.createGain();
      const rainFilter = ctx.createBiquadFilter();
      
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;
      rainSource.connect(rainFilter);
      rainFilter.connect(rainGain);
      rainGain.connect(ctx.destination);
      
      // Filter to create rain-like frequency response
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 3000;
      rainFilter.Q.value = 0.5;
      
      rainGain.gain.setValueAtTime(0.4 * this.masterVolume, now);
      
      rainSource.start(now);
      
      // Store reference for stopping
      this.currentRainSource = rainSource;
      
    } catch (error) {
      console.error('Error playing rain sound:', error);
    }
  }

  /**
   * HEAVY RAIN SOUND - Intense rain with thunder
   */
  public playHeavyRainSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 12; // 12 seconds for looping
      
      // Create heavy rain buffer with thunder
      const rainBuffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
      const rainData = rainBuffer.getChannelData(0);
      
      // Track thunder timing
      const thunderTimes = [2.5, 7.8]; // Thunder at these times in the loop
      
      for (let i = 0; i < rainBuffer.length; i++) {
        const t = i / ctx.sampleRate;
        
        // Heavy rain - more intense white noise
        let sample = (Math.random() - 0.5) * 2;
        
        // More dramatic wind variations
        const windVariation = 0.8 + 0.4 * Math.sin(t * 0.4) * Math.sin(t * 0.17);
        
        // More frequent droplet emphasis for heavy rain
        const dropletChance = Math.random();
        if (dropletChance < 0.003) { // More frequent emphasized droplets
          sample += Math.sin(t * 2 * Math.PI * (600 + Math.random() * 600)) * 
                   Math.exp(-((i % (ctx.sampleRate * 0.08)) / (ctx.sampleRate * 0.015))) * 0.7;
        }
        
        // Add thunder at specific times
        for (const thunderTime of thunderTimes) {
          const thunderStart = thunderTime;
          const thunderEnd = thunderTime + 3.0;
          
          if (t >= thunderStart && t <= thunderEnd) {
            const thunderT = (t - thunderStart) / (thunderEnd - thunderStart);
            
            // Thunder rumble - low frequency noise with dramatic envelope
            const thunderEnv = Math.exp(-thunderT * 2) * (1 - thunderT);
            const thunderRumble = (Math.random() - 0.5) * thunderEnv * 0.8;
            
            // Initial crack - high frequency burst
            if (thunderT < 0.1) {
              const crack = Math.sin(t * 2 * Math.PI * (2000 + Math.random() * 3000)) * 
                           Math.exp(-thunderT * 30) * 0.6;
              sample += crack + thunderRumble;
            } else {
              sample += thunderRumble;
            }
          }
        }
        
        // Apply wind variation and scale for heavy rain
        rainData[i] = sample * windVariation * 0.5;
      }
      
      const rainSource = ctx.createBufferSource();
      const rainGain = ctx.createGain();
      const rainFilter = ctx.createBiquadFilter();
      const thunderFilter = ctx.createBiquadFilter();
      
      rainSource.buffer = rainBuffer;
      rainSource.loop = true;
      rainSource.connect(rainFilter);
      rainFilter.connect(thunderFilter);
      thunderFilter.connect(rainGain);
      rainGain.connect(ctx.destination);
      
      // Primary rain filter
      rainFilter.type = 'bandpass';
      rainFilter.frequency.value = 2500;
      rainFilter.Q.value = 0.4;
      
      // Secondary filter to enhance thunder rumble
      thunderFilter.type = 'highpass';
      thunderFilter.frequency.value = 100;
      thunderFilter.Q.value = 0.7;
      
      rainGain.gain.setValueAtTime(0.6 * this.masterVolume, now);
      
      rainSource.start(now);
      
      // Store reference for stopping
      this.currentHeavyRainSource = rainSource;
      
    } catch (error) {
      console.error('Error playing heavy rain sound:', error);
    }
  }

  /**
   * STOP RAIN - Stops all rain sounds
   */
  public stopRainSounds() {
    if (this.currentRainSource) {
      this.currentRainSource.stop();
      this.currentRainSource = null;
    }
    if (this.currentHeavyRainSource) {
      this.currentHeavyRainSource.stop();
      this.currentHeavyRainSource = null;
    }
  }

  /**
   * STOP ALL MUSIC - Stops all background music
   */
  public stopAllMusic() {
    // Stop generic music
    this.genericMusicNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Source may have already ended naturally
      }
    });
    this.genericMusicNodes = [];
    this.genericMusicPlaying = false;

    // Stop marketplace ambient
    this.marketplaceNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Source may have already ended naturally
      }
    });
    this.marketplaceNodes = [];
    this.marketplacePlaying = false;

    // Stop intense battle music
    this.battleNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Source may have already ended naturally
      }
    });
    this.battleNodes = [];
    this.battlePlaying = false;

    // Stop fishing music
    this.stopFishingMusic();

    // Stop mining music
    this.stopMiningMusic();

    // Stop dungeon music
    this.stopDungeonMusic();
    this.stopDungeonMusicWithRandomTiming();

    // Stop victory melody
    this.stopVictoryMelody();
    // Stop new special map music
    this.stopGovernmentMusic();
    this.stopEstatesMusic();
    this.stopTempleMusic();
    this.stopDangerMusic();
    this.stopModernCityMusic();
    this.stopFF6CombatMusic();
  }

  /**
   * FF6-STYLE VICTORY MELODY - Classic victory fanfare
   */
  private victoryNodes: AudioNode[] = [];
  private victoryPlaying = false;

  public playVictoryMelody() {
    if (this.isMuted || this.victoryPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.victoryPlaying = true;
      this.victoryNodes = [];
      const now = ctx.currentTime;
      
      // Create master gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.25 * this.masterVolume, now);
      masterGain.connect(ctx.destination);
      this.victoryNodes.push(masterGain);

      // FF6 Victory Theme structure:
      // Opening fanfare: G-G-G-G E-F-G-C (8 notes)
      // Then triumphant progression
      
      let time = 0;
      
      // Opening fanfare - rapid G notes
      for (let i = 0; i < 4; i++) {
        this.createVictoryNote(ctx, now + time, 783.99, 0.1, masterGain); // G5
        time += 0.12;
      }
      
      // Rising melody E-F-G
      this.createVictoryNote(ctx, now + time, 659.25, 0.15, masterGain); // E5
      time += 0.17;
      this.createVictoryNote(ctx, now + time, 698.46, 0.15, masterGain); // F5
      time += 0.17;
      this.createVictoryNote(ctx, now + time, 783.99, 0.15, masterGain); // G5
      time += 0.17;
      
      // Resolution to high C
      this.createVictoryNote(ctx, now + time, 1046.50, 0.6, masterGain); // C6
      this.createVictoryChord(ctx, now + time, [523.25, 659.25, 783.99], 0.6, masterGain); // C major chord
      time += 0.7;
      
      // Second phrase - triumphant progression
      const melody2 = [
        {note: 880.00, duration: 0.25}, // A5
        {note: 783.99, duration: 0.25}, // G5
        {note: 698.46, duration: 0.25}, // F5
        {note: 659.25, duration: 0.25}, // E5
        {note: 587.33, duration: 0.25}, // D5
        {note: 523.25, duration: 0.25}, // C5
        {note: 587.33, duration: 0.25}, // D5
        {note: 659.25, duration: 0.5},  // E5
      ];
      
      for (const {note, duration} of melody2) {
        this.createVictoryNote(ctx, now + time, note, duration * 0.9, masterGain);
        time += duration;
      }
      
      // Final triumphant chords
      const finalChords = [
        [523.25, 659.25, 783.99, 1046.50], // C major with octave
        [587.33, 739.99, 880.00, 1174.66], // D major with octave
        [659.25, 830.61, 987.77, 1318.51], // E major with octave
        [523.25, 659.25, 783.99, 1046.50], // C major final
      ];
      
      for (let i = 0; i < finalChords.length; i++) {
        const chordDuration = i === finalChords.length - 1 ? 1.5 : 0.4;
        this.createVictoryChord(ctx, now + time, finalChords[i], chordDuration, masterGain);
        time += chordDuration + 0.1;
      }
      
      // Add background harmony throughout
      this.createVictoryHarmony(ctx, now, time, masterGain);
      
      // Stop after completion
      setTimeout(() => {
        this.stopVictoryMelody();
      }, time * 1000);
      
    } catch (error) {
      console.error('Error playing victory melody:', error);
      this.victoryPlaying = false;
    }
  }

  private createVictoryNote(ctx: AudioContext, time: number, freq: number, duration: number, masterGain: GainNode) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.type = 'square'; // Classic 8-bit sound
    osc.frequency.value = freq;
    
    // Add slight vibrato for richness
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibrato.type = 'sine';
    vibrato.frequency.value = 5;
    vibratoGain.gain.value = freq * 0.01;
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.5, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.3, time + duration * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    osc.start(time);
    osc.stop(time + duration);
    vibrato.start(time);
    vibrato.stop(time + duration);
    
    this.victoryNodes.push(osc, gain, vibrato, vibratoGain);
  }

  private createVictoryChord(ctx: AudioContext, time: number, frequencies: number[], duration: number, masterGain: GainNode) {
    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.4, time);
    chordGain.connect(masterGain);
    
    for (const freq of frequencies) {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      
      osc.connect(noteGain);
      noteGain.connect(chordGain);
      
      osc.type = 'triangle'; // Softer for chords
      osc.frequency.value = freq;
      
      noteGain.gain.setValueAtTime(0, time);
      noteGain.gain.linearRampToValueAtTime(0.6, time + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.1, time + duration * 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.01, time + duration);
      
      osc.start(time);
      osc.stop(time + duration);
      
      this.victoryNodes.push(osc, noteGain);
    }
    
    this.victoryNodes.push(chordGain);
  }

  private createVictoryHarmony(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const harmonyGain = ctx.createGain();
    harmonyGain.gain.setValueAtTime(0.15, startTime);
    harmonyGain.connect(masterGain);
    
    // Bass line following chord progression
    const bassNotes = [
      {freq: 130.81, time: 0, dur: 0.5},     // C3
      {freq: 130.81, time: 0.5, dur: 0.5},   // C3
      {freq: 146.83, time: 1.0, dur: 0.5},   // D3
      {freq: 164.81, time: 1.5, dur: 0.5},   // E3
      {freq: 174.61, time: 2.0, dur: 0.5},   // F3
      {freq: 164.81, time: 2.5, dur: 0.5},   // E3
      {freq: 146.83, time: 3.0, dur: 0.5},   // D3
      {freq: 130.81, time: 3.5, dur: 1.5},   // C3
    ];
    
    for (const {freq, time, dur} of bassNotes) {
      if (time < duration) {
        const bass = ctx.createOscillator();
        const bassGain = ctx.createGain();
        
        bass.connect(bassGain);
        bassGain.connect(harmonyGain);
        
        bass.type = 'sine';
        bass.frequency.value = freq;
        
        bassGain.gain.setValueAtTime(0.8, startTime + time);
        bassGain.gain.exponentialRampToValueAtTime(0.01, startTime + time + dur);
        
        bass.start(startTime + time);
        bass.stop(startTime + time + dur);
        
        this.victoryNodes.push(bass, bassGain);
      }
    }
    
    this.victoryNodes.push(harmonyGain);
  }

  public stopVictoryMelody() {
    this.victoryNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.victoryNodes = [];
    this.victoryPlaying = false;
  }

  /**
   * PEACEFUL FISHING MUSIC - Soft, looping ambient music for fishing
   */
  private fishingNodes: AudioNode[] = [];
  private fishingPlaying = false;

  public playFishingMusic() {
    if (this.isMuted || this.fishingPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.fishingPlaying = true;
      this.fishingNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 32; // 32 seconds per loop
      
      // Create master gain - very soft for peaceful ambiance
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.1 * this.masterVolume, now);
      masterGain.connect(ctx.destination);
      this.fishingNodes.push(masterGain);

      // Create peaceful musical layers
      this.createGentleWaterSounds(ctx, now, loopDuration, masterGain);
      this.createSoftMelody(ctx, now, loopDuration, masterGain);
      this.createAmbientPads(ctx, now, loopDuration, masterGain);
      this.createSubtleArpeggio(ctx, now, loopDuration, masterGain);
      
      // Loop the music continuously
      const loopFishing = () => {
        if (this.fishingPlaying) {
          setTimeout(() => {
            if (this.fishingPlaying) {
              // Clear old nodes
              this.fishingNodes = this.fishingNodes.filter(node => node === masterGain);
              // Restart the loop
              const loopTime = ctx.currentTime;
              this.createGentleWaterSounds(ctx, loopTime, loopDuration, masterGain);
              this.createSoftMelody(ctx, loopTime, loopDuration, masterGain);
              this.createAmbientPads(ctx, loopTime, loopDuration, masterGain);
              this.createSubtleArpeggio(ctx, loopTime, loopDuration, masterGain);
              loopFishing();
            }
          }, loopDuration * 1000);
        }
      };
      
      loopFishing();
      
    } catch (error) {
      console.error('Error playing fishing music:', error);
      this.fishingPlaying = false;
    }
  }

  private createGentleWaterSounds(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const waterGain = ctx.createGain();
    waterGain.gain.setValueAtTime(0.3, startTime);
    waterGain.connect(masterGain);
    
    // Subtle water lapping sounds using filtered noise
    for (let i = 0; i < duration; i += 2) {
      const waterBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const waterData = waterBuffer.getChannelData(0);
      
      // Generate soft water texture
      for (let j = 0; j < waterBuffer.length; j++) {
        const t = j / ctx.sampleRate;
        waterData[j] = (Math.random() - 0.5) * Math.exp(-t * 3) * 0.3;
      }
      
      const waterSource = ctx.createBufferSource();
      const waterNoteGain = ctx.createGain();
      const waterFilter = ctx.createBiquadFilter();
      
      waterSource.buffer = waterBuffer;
      waterSource.connect(waterFilter);
      waterFilter.connect(waterNoteGain);
      waterNoteGain.connect(waterGain);
      
      waterFilter.type = 'lowpass';
      waterFilter.frequency.value = 400 + Math.random() * 200;
      waterFilter.Q.value = 0.5;
      
      waterNoteGain.gain.setValueAtTime(0.4 + Math.random() * 0.2, startTime + i);
      waterNoteGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + 0.5);
      
      waterSource.start(startTime + i);
      this.fishingNodes.push(waterSource, waterNoteGain, waterFilter);
    }
    
    this.fishingNodes.push(waterGain);
  }

  private createSoftMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.25, startTime);
    melodyGain.connect(masterGain);
    
    // Gentle pentatonic melody (C-D-E-G-A scale - very peaceful)
    const peacefulMelody = [
      {note: 523.25, duration: 2.0, delay: 0},    // C5
      {note: 587.33, duration: 1.5, delay: 2.5}, // D5
      {note: 659.25, duration: 2.0, delay: 4.5}, // E5
      {note: 523.25, duration: 1.5, delay: 7.0}, // C5
      {note: 783.99, duration: 3.0, delay: 9.0}, // G5
      {note: 659.25, duration: 2.0, delay: 12.5}, // E5
      {note: 880.00, duration: 1.5, delay: 15.0}, // A5
      {note: 783.99, duration: 2.5, delay: 17.0}, // G5
      {note: 659.25, duration: 3.0, delay: 20.0}, // E5
      {note: 523.25, duration: 4.0, delay: 24.0}, // C5
    ];
    
    for (const {note, duration, delay} of peacefulMelody) {
      if (delay < duration) {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const noteTime = startTime + delay;
        
        osc.connect(noteGain);
        noteGain.connect(melodyGain);
        
        osc.type = 'sine'; // Pure, gentle tone
        osc.frequency.value = note;
        
        // Very soft attack and release
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.3, noteTime + 0.5);
        noteGain.gain.exponentialRampToValueAtTime(0.1, noteTime + duration * 0.7);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + duration);
        
        osc.start(noteTime);
        osc.stop(noteTime + duration);
        this.fishingNodes.push(osc, noteGain);
      }
    }
    
    this.fishingNodes.push(melodyGain);
  }

  private createAmbientPads(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.15, startTime);
    padGain.connect(masterGain);
    
    // Soft chord progressions - very peaceful
    const chordProgression = [
      {chords: [261.63, 329.63, 392.00], duration: 8, delay: 0},  // C major
      {chords: [174.61, 220.00, 293.66], duration: 8, delay: 8},  // F major
      {chords: [196.00, 246.94, 329.63], duration: 8, delay: 16}, // G major  
      {chords: [261.63, 329.63, 392.00], duration: 8, delay: 24}, // C major
    ];
    
    for (const {chords, duration: chordDuration, delay} of chordProgression) {
      if (delay < duration) {
        for (const freq of chords) {
          const pad = ctx.createOscillator();
          const padNoteGain = ctx.createGain();
          const chordTime = startTime + delay;
          
          pad.connect(padNoteGain);
          padNoteGain.connect(padGain);
          
          pad.type = 'triangle'; // Soft, warm tone
          pad.frequency.value = freq;
          
          // Very gradual fade in and out
          padNoteGain.gain.setValueAtTime(0, chordTime);
          padNoteGain.gain.linearRampToValueAtTime(0.4, chordTime + 2);
          padNoteGain.gain.setValueAtTime(0.4, chordTime + chordDuration - 2);
          padNoteGain.gain.linearRampToValueAtTime(0.01, chordTime + chordDuration);
          
          pad.start(chordTime);
          pad.stop(chordTime + chordDuration);
          this.fishingNodes.push(pad, padNoteGain);
        }
      }
    }
    
    this.fishingNodes.push(padGain);
  }

  private createSubtleArpeggio(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const arpeggioGain = ctx.createGain();
    arpeggioGain.gain.setValueAtTime(0.12, startTime);
    arpeggioGain.connect(masterGain);
    
    // Very gentle arpeggiated pattern
    const arpeggioNotes = [
      523.25, 659.25, 783.99, 880.00, // C5, E5, G5, A5
      783.99, 659.25, 523.25, 440.00  // G5, E5, C5, A4
    ];
    
    const noteLength = 1.0;
    
    for (let i = 0; i < duration; i += noteLength) {
      const noteIndex = Math.floor(i / noteLength) % arpeggioNotes.length;
      const arp = ctx.createOscillator();
      const arpGain = ctx.createGain();
      
      arp.connect(arpGain);
      arpGain.connect(arpeggioGain);
      
      arp.type = 'triangle';
      arp.frequency.value = arpeggioNotes[noteIndex];
      
      // Gentle plucking effect
      arpGain.gain.setValueAtTime(0, startTime + i);
      arpGain.gain.linearRampToValueAtTime(0.2, startTime + i + 0.1);
      arpGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + noteLength);
      
      arp.start(startTime + i);
      arp.stop(startTime + i + noteLength);
      this.fishingNodes.push(arp, arpGain);
    }
    
    this.fishingNodes.push(arpeggioGain);
  }

  public stopFishingMusic() {
    this.fishingNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.fishingNodes = [];
    this.fishingPlaying = false;
  }

  /**
   * DUNGEON MUSIC - Peaceful but mysterious music for roguelike exploration
   * Inspired by Stardew Valley mines music
   */
  private dungeonNodes: AudioNode[] = [];
  private dungeonPlaying = false;

  public playDungeonMusic() {
    if (this.isMuted || this.dungeonPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.dungeonPlaying = true;
      this.dungeonNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 48; // 48 seconds for a longer, more immersive loop
      
      // Create master gain with fade-in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 3); // 3-second fade-in
      masterGain.connect(ctx.destination);
      this.dungeonNodes.push(masterGain);

      // Create mysterious, peaceful musical layers
      this.createSubtleDrums(ctx, now, loopDuration, masterGain);
      this.createMysteriousBass(ctx, now, loopDuration, masterGain);
      this.createEtherealPads(ctx, now, loopDuration, masterGain);
      this.createHauntingMelody(ctx, now, loopDuration, masterGain);
      this.createAmbientTextures(ctx, now, loopDuration, masterGain);
      this.createCrystallineArpeggio(ctx, now, loopDuration, masterGain);
      
      // Loop the music continuously with fade-out/fade-in cycles
      const loopDungeon = () => {
        if (this.dungeonPlaying) {
          setTimeout(() => {
            if (this.dungeonPlaying) {
              // Fade out current loop
              masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
              
              setTimeout(() => {
                if (this.dungeonPlaying) {
                  // Clear old nodes except master gain
                  this.dungeonNodes = this.dungeonNodes.filter(node => node === masterGain);
                  
                  // Restart the loop with fade-in
                  const loopTime = ctx.currentTime;
                  masterGain.gain.setValueAtTime(0, loopTime);
                  masterGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, loopTime + 3);
                  
                  this.createSubtleDrums(ctx, loopTime, loopDuration, masterGain);
                  this.createMysteriousBass(ctx, loopTime, loopDuration, masterGain);
                  this.createEtherealPads(ctx, loopTime, loopDuration, masterGain);
                  this.createHauntingMelody(ctx, loopTime, loopDuration, masterGain);
                  this.createAmbientTextures(ctx, loopTime, loopDuration, masterGain);
                  this.createCrystallineArpeggio(ctx, loopTime, loopDuration, masterGain);
                  
                  loopDungeon();
                }
              }, 3000); // 3-second silence between loops
            }
          }, loopDuration * 1000);
        }
      };
      
      loopDungeon();
      
    } catch (error) {
      console.error('Error playing dungeon music:', error);
      this.dungeonPlaying = false;
    }
  }

  private createSubtleDrums(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const drumGain = ctx.createGain();
    drumGain.gain.setValueAtTime(0.2, startTime);
    drumGain.connect(masterGain);
    
    const beatLength = 1.5; // Slower, contemplative beat
    
    for (let i = 0; i < duration; i += beatLength) {
      const beat = Math.floor(i / beatLength) % 8;
      
      // Soft kick on beats 1 and 5
      if (beat === 0 || beat === 4) {
        this.createSoftKick(ctx, startTime + i, drumGain);
      }
      
      // Gentle rim shot on beats 3 and 7
      if (beat === 2 || beat === 6) {
        this.createRimShot(ctx, startTime + i, drumGain);
      }
      
      // Subtle hi-hat on off-beats
      if (beat % 2 === 1) {
        this.createWhisperHiHat(ctx, startTime + i, drumGain);
      }
    }
    
    this.dungeonNodes.push(drumGain);
  }

  private createSoftKick(ctx: AudioContext, time: number, drumGain: GainNode) {
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    
    kick.connect(kickGain);
    kickGain.connect(drumGain);
    
    kick.type = 'sine';
    kick.frequency.setValueAtTime(60, time);
    kick.frequency.exponentialRampToValueAtTime(35, time + 0.2);
    
    kickGain.gain.setValueAtTime(0.4, time);
    kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    kick.start(time);
    kick.stop(time + 0.2);
    this.dungeonNodes.push(kick, kickGain);
  }

  private createRimShot(ctx: AudioContext, time: number, drumGain: GainNode) {
    const rimBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const rimData = rimBuffer.getChannelData(0);
    
    for (let i = 0; i < rimBuffer.length; i++) {
      rimData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (rimBuffer.length * 0.3));
    }
    
    const rim = ctx.createBufferSource();
    const rimGain = ctx.createGain();
    const rimFilter = ctx.createBiquadFilter();
    
    rim.buffer = rimBuffer;
    rim.connect(rimFilter);
    rimFilter.connect(rimGain);
    rimGain.connect(drumGain);
    
    rimFilter.type = 'highpass';
    rimFilter.frequency.value = 2000;
    
    rimGain.gain.setValueAtTime(0.3, time);
    rimGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    rim.start(time);
    this.dungeonNodes.push(rim, rimGain, rimFilter);
  }

  private createWhisperHiHat(ctx: AudioContext, time: number, drumGain: GainNode) {
    const hihatBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const hihatData = hihatBuffer.getChannelData(0);
    
    for (let i = 0; i < hihatBuffer.length; i++) {
      hihatData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (hihatBuffer.length * 0.1));
    }
    
    const hihat = ctx.createBufferSource();
    const hihatGain = ctx.createGain();
    const hihatFilter = ctx.createBiquadFilter();
    
    hihat.buffer = hihatBuffer;
    hihat.connect(hihatFilter);
    hihatFilter.connect(hihatGain);
    hihatGain.connect(drumGain);
    
    hihatFilter.type = 'highpass';
    hihatFilter.frequency.value = 8000;
    
    hihatGain.gain.setValueAtTime(0.15, time);
    hihatGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    
    hihat.start(time);
    this.dungeonNodes.push(hihat, hihatGain, hihatFilter);
  }

  private createMysteriousBass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.25, startTime);
    bassGain.connect(masterGain);
    
    // Mysterious minor progression: Am - F - C - G - Am - Dm - G - Am
    const mysteriousBass = [
      {freq: 55.00, duration: 6},   // A1
      {freq: 43.65, duration: 6},   // F1
      {freq: 32.70, duration: 6},   // C1
      {freq: 49.00, duration: 6},   // G1
      {freq: 55.00, duration: 6},   // A1
      {freq: 36.71, duration: 6},   // D1
      {freq: 49.00, duration: 6},   // G1
      {freq: 55.00, duration: 6},   // A1
    ];
    
    let currentTime = 0;
    for (const {freq, duration} of mysteriousBass) {
      if (currentTime < duration) {
        const bass = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const bassFilter = ctx.createBiquadFilter();
        
        bass.connect(bassFilter);
        bassFilter.connect(noteGain);
        noteGain.connect(bassGain);
        
        bass.type = 'sine';
        bass.frequency.value = freq;
        
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 200;
        bassFilter.Q.value = 2;
        
        noteGain.gain.setValueAtTime(0, startTime + currentTime);
        noteGain.gain.linearRampToValueAtTime(0.6, startTime + currentTime + 1);
        noteGain.gain.setValueAtTime(0.6, startTime + currentTime + duration - 1);
        noteGain.gain.linearRampToValueAtTime(0.01, startTime + currentTime + duration);
        
        bass.start(startTime + currentTime);
        bass.stop(startTime + currentTime + duration);
        this.dungeonNodes.push(bass, noteGain, bassFilter);
      }
      currentTime += duration;
    }
    
    this.dungeonNodes.push(bassGain);
  }

  private createEtherealPads(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.12, startTime);
    padGain.connect(masterGain);
    
    // Ethereal minor chord progressions
    const etherealChords = [
      {chords: [220.00, 261.63, 329.63], duration: 12, delay: 0},  // Am
      {chords: [174.61, 220.00, 261.63], duration: 12, delay: 12}, // F
      {chords: [130.81, 164.81, 196.00], duration: 12, delay: 24}, // C
      {chords: [196.00, 246.94, 293.66], duration: 12, delay: 36}, // G
    ];
    
    for (const {chords, duration: chordDuration, delay} of etherealChords) {
      if (delay < duration) {
        for (let harmonic = 1; harmonic <= 2; harmonic++) {
          for (const freq of chords) {
            const pad = ctx.createOscillator();
            const padNoteGain = ctx.createGain();
            const padFilter = ctx.createBiquadFilter();
            const chordTime = startTime + delay;
            
            pad.connect(padFilter);
            padFilter.connect(padNoteGain);
            padNoteGain.connect(padGain);
            
            pad.type = 'triangle';
            pad.frequency.value = freq * harmonic;
            
            padFilter.type = 'lowpass';
            padFilter.frequency.value = 1000;
            padFilter.Q.value = 0.7;
            
            // Very slow attack and release for ethereal quality
            padNoteGain.gain.setValueAtTime(0, chordTime);
            padNoteGain.gain.linearRampToValueAtTime(0.3 / harmonic, chordTime + 4);
            padNoteGain.gain.setValueAtTime(0.3 / harmonic, chordTime + chordDuration - 4);
            padNoteGain.gain.linearRampToValueAtTime(0.01, chordTime + chordDuration);
            
            pad.start(chordTime);
            pad.stop(chordTime + chordDuration);
            this.dungeonNodes.push(pad, padNoteGain, padFilter);
          }
        }
      }
    }
    
    this.dungeonNodes.push(padGain);
  }

  private createHauntingMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.18, startTime);
    melodyGain.connect(masterGain);
    
    // Haunting melody in A minor with mysterious intervals
    const hauntingMelody = [
      {note: 440.00, duration: 3.0, delay: 2},    // A4
      {note: 523.25, duration: 2.0, delay: 6},    // C5
      {note: 493.88, duration: 2.5, delay: 9},    // B4
      {note: 440.00, duration: 4.0, delay: 12},   // A4
      {note: 349.23, duration: 3.0, delay: 17},   // F4
      {note: 392.00, duration: 2.0, delay: 21},   // G4
      {note: 440.00, duration: 5.0, delay: 24},   // A4
      {note: 587.33, duration: 2.0, delay: 30},   // D5
      {note: 523.25, duration: 3.0, delay: 33},   // C5
      {note: 493.88, duration: 2.5, delay: 37},   // B4
      {note: 440.00, duration: 6.0, delay: 40},   // A4
    ];
    
    for (const {note, duration, delay} of hauntingMelody) {
      if (delay < duration) {
        const melody = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const melodyFilter = ctx.createBiquadFilter();
        const reverb = ctx.createConvolver();
        const noteTime = startTime + delay;
        
        melody.connect(melodyFilter);
        melodyFilter.connect(noteGain);
        noteGain.connect(melodyGain);
        
        melody.type = 'sine';
        melody.frequency.value = note;
        
        melodyFilter.type = 'lowpass';
        melodyFilter.frequency.value = 2000;
        melodyFilter.Q.value = 1;
        
        // Slow, mysterious attack
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.4, noteTime + 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.2, noteTime + duration * 0.7);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + duration);
        
        melody.start(noteTime);
        melody.stop(noteTime + duration);
        this.dungeonNodes.push(melody, noteGain, melodyFilter);
      }
    }
    
    this.dungeonNodes.push(melodyGain);
  }

  private createAmbientTextures(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const textureGain = ctx.createGain();
    textureGain.gain.setValueAtTime(0.08, startTime);
    textureGain.connect(masterGain);
    
    // Mysterious ambient textures - like distant cave sounds
    for (let i = 0; i < duration; i += 4) {
      const textureBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const textureData = textureBuffer.getChannelData(0);
      
      // Generate mysterious cave-like texture
      for (let j = 0; j < textureBuffer.length; j++) {
        const t = j / ctx.sampleRate;
        let sample = (Math.random() - 0.5) * Math.exp(-t * 2);
        
        // Add some low-frequency rumble
        sample += Math.sin(t * 2 * Math.PI * (10 + Math.random() * 20)) * 0.3 * Math.exp(-t);
        
        textureData[j] = sample * 0.4;
      }
      
      const texture = ctx.createBufferSource();
      const textureNoteGain = ctx.createGain();
      const textureFilter = ctx.createBiquadFilter();
      
      texture.buffer = textureBuffer;
      texture.connect(textureFilter);
      textureFilter.connect(textureNoteGain);
      textureNoteGain.connect(textureGain);
      
      textureFilter.type = 'lowpass';
      textureFilter.frequency.value = 300 + Math.random() * 200;
      textureFilter.Q.value = 2;
      
      textureNoteGain.gain.setValueAtTime(0.3 + Math.random() * 0.3, startTime + i);
      textureNoteGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + 2);
      
      texture.start(startTime + i);
      this.dungeonNodes.push(texture, textureNoteGain, textureFilter);
    }
    
    this.dungeonNodes.push(textureGain);
  }

  private createCrystallineArpeggio(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const arpeggioGain = ctx.createGain();
    arpeggioGain.gain.setValueAtTime(0.1, startTime);
    arpeggioGain.connect(masterGain);
    
    // Crystalline arpeggiated pattern - like water drops in a cave
    const mysticalNotes = [
      880.00, 1046.50, 1174.66, 1318.51, // A5, C6, D6, E6
      1174.66, 1046.50, 880.00, 739.99   // D6, C6, A5, F#5
    ];
    
    const noteLength = 2.0; // Slower, more contemplative
    
    for (let i = 0; i < duration; i += noteLength) {
      const noteIndex = Math.floor(i / noteLength) % mysticalNotes.length;
      const arp = ctx.createOscillator();
      const arpGain = ctx.createGain();
      const arpFilter = ctx.createBiquadFilter();
      
      arp.connect(arpFilter);
      arpFilter.connect(arpGain);
      arpGain.connect(arpeggioGain);
      
      arp.type = 'sine';
      arp.frequency.value = mysticalNotes[noteIndex];
      
      arpFilter.type = 'lowpass';
      arpFilter.frequency.value = 3000;
      arpFilter.Q.value = 3;
      
      // Crystal-like attack
      arpGain.gain.setValueAtTime(0, startTime + i);
      arpGain.gain.linearRampToValueAtTime(0.3, startTime + i + 0.2);
      arpGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + noteLength);
      
      arp.start(startTime + i);
      arp.stop(startTime + i + noteLength);
      this.dungeonNodes.push(arp, arpGain, arpFilter);
    }
    
    this.dungeonNodes.push(arpeggioGain);
  }

  public stopDungeonMusic() {
    this.dungeonNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.dungeonNodes = [];
    this.dungeonPlaying = false;
  }

  /**
   * MINING MUSIC - Industrial, rhythmic music for mining
   * Deep bass, metallic percussion, echoing ambience
   */
  private miningNodes: AudioNode[] = [];
  private miningPlaying = false;

  public playMiningMusic() {
    if (this.isMuted || this.miningPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.miningPlaying = true;
      this.miningNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 24; // 24 seconds per loop

      // Create master gain - moderate volume for work ambiance
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 2); // Fade in
      masterGain.connect(ctx.destination);
      this.miningNodes.push(masterGain);

      // Create mining music layers
      this.createMiningPercussion(ctx, now, loopDuration, masterGain);
      this.createDeepMineBass(ctx, now, loopDuration, masterGain);
      this.createMetallicMelody(ctx, now, loopDuration, masterGain);
      this.createCaveAmbience(ctx, now, loopDuration, masterGain);

      // Loop the music continuously
      const loopMining = () => {
        if (this.miningPlaying) {
          setTimeout(() => {
            if (this.miningPlaying) {
              // Clear old nodes
              this.miningNodes = this.miningNodes.filter(node => node === masterGain);
              // Restart the loop
              this.createMiningPercussion(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createDeepMineBass(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createMetallicMelody(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createCaveAmbience(ctx, ctx.currentTime, loopDuration, masterGain);
              loopMining();
            }
          }, loopDuration * 1000);
        }
      };
      loopMining();

    } catch (error) {
      console.warn('Could not play mining music:', error);
      this.miningPlaying = false;
    }
  }

  private createMiningPercussion(ctx: AudioContext, now: number, duration: number, output: AudioNode) {
    // Rhythmic pickaxe hits and industrial sounds
    const percussionGain = ctx.createGain();
    percussionGain.gain.value = 0.6;
    percussionGain.connect(output);

    // Main pickaxe rhythm
    const beatTime = 0.5; // Half second per beat
    for (let i = 0; i < duration / beatTime; i++) {
      const time = now + i * beatTime;

      // Main hit on beats 1 and 3
      if (i % 4 === 0 || i % 4 === 2) {
        const hit = ctx.createOscillator();
        const hitGain = ctx.createGain();
        const hitFilter = ctx.createBiquadFilter();

        hit.type = 'sawtooth';
        hit.frequency.value = 60;

        hitFilter.type = 'lowpass';
        hitFilter.frequency.value = 200;
        hitFilter.Q.value = 10;

        hit.connect(hitFilter);
        hitFilter.connect(hitGain);
        hitGain.connect(percussionGain);

        hitGain.gain.setValueAtTime(0.3, time);
        hitGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        hit.start(time);
        hit.stop(time + 0.1);

        this.miningNodes.push(hit, hitGain, hitFilter);
      }

      // Metallic tink on off-beats
      if (i % 2 === 1) {
        const tink = ctx.createOscillator();
        const tinkGain = ctx.createGain();

        tink.type = 'sine';
        tink.frequency.value = 800 + Math.random() * 400;

        tink.connect(tinkGain);
        tinkGain.connect(percussionGain);

        tinkGain.gain.setValueAtTime(0.05, time);
        tinkGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        tink.start(time);
        tink.stop(time + 0.05);

        this.miningNodes.push(tink, tinkGain);
      }
    }

    this.miningNodes.push(percussionGain);
  }

  private createDeepMineBass(ctx: AudioContext, now: number, duration: number, output: AudioNode) {
    // Deep, rumbling bass line
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.4;
    bassGain.connect(output);

    const bass = ctx.createOscillator();
    const bassFilter = ctx.createBiquadFilter();

    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(55, now); // Low A

    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 150;
    bassFilter.Q.value = 5;

    bass.connect(bassFilter);
    bassFilter.connect(bassGain);

    // Bass pattern - slow, ominous progression
    const bassNotes = [55, 52, 49, 52]; // A, F#, E, F#
    const noteLength = duration / bassNotes.length;

    bassNotes.forEach((note, i) => {
      const time = now + i * noteLength;
      bass.frequency.setValueAtTime(note, time);
    });

    bass.start(now);
    bass.stop(now + duration);

    this.miningNodes.push(bass, bassFilter, bassGain);
  }

  private createMetallicMelody(ctx: AudioContext, now: number, duration: number, output: AudioNode) {
    // Sparse, echoing metallic melody
    const melodyGain = ctx.createGain();
    melodyGain.gain.value = 0.3;
    melodyGain.connect(output);

    // Add reverb for cave echo
    const convolver = ctx.createConvolver();
    const impulseLength = 2;
    const impulse = ctx.createBuffer(2, ctx.sampleRate * impulseLength, ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / channelData.length, 2);
      }
    }

    convolver.buffer = impulse;
    convolver.connect(melodyGain);

    // Melody notes - minor pentatonic for mysterious feel
    const notes = [220, 262, 294, 330, 392]; // A minor pentatonic
    const noteSpacing = 2; // 2 seconds between notes

    for (let i = 0; i < duration / noteSpacing; i++) {
      const time = now + i * noteSpacing + Math.random() * 0.1; // Slight timing variation
      const note = notes[Math.floor(Math.random() * notes.length)];

      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine'; // Pure, bell-like mystical tone
      osc.frequency.value = note;

      osc.connect(oscGain);
      oscGain.connect(convolver);

      oscGain.gain.setValueAtTime(0, time);
      oscGain.gain.linearRampToValueAtTime(0.15, time + 0.1);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 1.5);

      osc.start(time);
      osc.stop(time + 1.5);

      this.miningNodes.push(osc, oscGain);
    }

    this.miningNodes.push(convolver, melodyGain);
  }

  private createCaveAmbience(ctx: AudioContext, now: number, duration: number, output: AudioNode) {
    // Ambient cave sounds - dripping water, echoes
    const ambienceGain = ctx.createGain();
    ambienceGain.gain.value = 0.2;
    ambienceGain.connect(output);

    // Low frequency rumble
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    const rumbleFilter = ctx.createBiquadFilter();

    rumble.type = 'sawtooth';
    rumble.frequency.value = 30;

    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 60;

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(ambienceGain);

    rumbleGain.gain.value = 0.3;

    rumble.start(now);
    rumble.stop(now + duration);

    // Occasional water drips
    for (let i = 0; i < 8; i++) {
      const dripTime = now + Math.random() * duration;

      const drip = ctx.createOscillator();
      const dripGain = ctx.createGain();
      const dripFilter = ctx.createBiquadFilter();

      drip.type = 'sine';
      drip.frequency.setValueAtTime(2000, dripTime);
      drip.frequency.exponentialRampToValueAtTime(500, dripTime + 0.1);

      dripFilter.type = 'bandpass';
      dripFilter.frequency.value = 1500;
      dripFilter.Q.value = 10;

      drip.connect(dripFilter);
      dripFilter.connect(dripGain);
      dripGain.connect(ambienceGain);

      dripGain.gain.setValueAtTime(0.1, dripTime);
      dripGain.gain.exponentialRampToValueAtTime(0.001, dripTime + 0.2);

      drip.start(dripTime);
      drip.stop(dripTime + 0.2);

      this.miningNodes.push(drip, dripGain, dripFilter);
    }

    this.miningNodes.push(rumble, rumbleFilter, rumbleGain, ambienceGain);
  }

  public stopMiningMusic() {
    this.miningNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.miningNodes = [];
    this.miningPlaying = false;
  }

  /**
   * MINING MUSIC V1 - Mystical Stardew-style with bouncy rhythm and catchy melody
   * Features pan pipes, piano, ambient washes, and rhythmic percussion
   */
  private miningMusicV1Nodes: AudioNode[] = [];
  private miningMusicV1Playing = false;

  public playMiningMusicV1() {
    if (this.isMuted || this.miningMusicV1Playing) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.miningMusicV1Playing = true;
      this.miningMusicV1Nodes = [];
      const now = ctx.currentTime;
      const loopDuration = 32; // 32 second loop

      // Master gain with slow 10 second fade-in for atmospheric build
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 10); // 10 second fade-in
      masterGain.connect(ctx.destination);
      this.miningMusicV1Nodes.push(masterGain);

      // Create all layers
      this.createMiningV1BouncyRhythm(ctx, now, loopDuration, masterGain);
      this.createMiningV1CatchyMelody(ctx, now, loopDuration, masterGain);
      this.createMiningV1PanPipes(ctx, now, loopDuration, masterGain);
      this.createMiningV1Piano(ctx, now, loopDuration, masterGain);
      this.createMiningV1AmbientWash(ctx, now, loopDuration, masterGain);

      // Loop continuously
      const loopMiningV1 = () => {
        if (this.miningMusicV1Playing) {
          setTimeout(() => {
            if (this.miningMusicV1Playing) {
              // Clear old nodes except master
              this.miningMusicV1Nodes = this.miningMusicV1Nodes.filter(node => node === masterGain);
              const loopTime = ctx.currentTime;

              this.createMiningV1BouncyRhythm(ctx, loopTime, loopDuration, masterGain);
              this.createMiningV1CatchyMelody(ctx, loopTime, loopDuration, masterGain);
              this.createMiningV1PanPipes(ctx, loopTime, loopDuration, masterGain);
              this.createMiningV1Piano(ctx, loopTime, loopDuration, masterGain);
              this.createMiningV1AmbientWash(ctx, loopTime, loopDuration, masterGain);

              loopMiningV1();
            }
          }, loopDuration * 1000);
        }
      };
      loopMiningV1();
    } catch (error) {
      console.error('Error playing mining music V1:', error);
      this.miningMusicV1Playing = false;
    }
  }

  private createMiningV1BouncyRhythm(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const rhythmGain = ctx.createGain();
    rhythmGain.gain.setValueAtTime(0.5, startTime); // Stronger beat presence
    rhythmGain.connect(masterGain);

    // Complex layered beat at 85 BPM (0.706s per beat)
    const beatLength = 0.706; // 60/85 seconds per beat
    const measureLength = beatLength * 4; // 4 beats per measure

    // Layer 1: Deep kick drum with more punch
    const kickPattern = [0, 0.75, 1.5, 2, 2.5, 3, 3.5]; // More complex pattern

    for (let measure = 0; measure < Math.ceil(duration / measureLength); measure++) {
      kickPattern.forEach((beat, index) => {
        const time = startTime + measure * measureLength + beat * beatLength;
        if (time >= startTime + duration) return;

        // Main kick
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kick.connect(kickGain);
        kickGain.connect(rhythmGain);

        kick.frequency.setValueAtTime(65, time);
        kick.frequency.exponentialRampToValueAtTime(35, time + 0.15);

        // Stronger attack for emphasis
        const velocity = index === 0 || index === 3 ? 0.4 : 0.3;
        kickGain.gain.setValueAtTime(velocity, time);
        kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

        kick.start(time);
        kick.stop(time + 0.2);
        this.miningMusicV1Nodes.push(kick);

        // Sub bass layer for extra depth
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        sub.connect(subGain);
        subGain.connect(rhythmGain);

        sub.type = 'sine';
        sub.frequency.value = 30;

        subGain.gain.setValueAtTime(velocity * 0.5, time);
        subGain.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

        sub.start(time);
        sub.stop(time + 0.25);
        this.miningMusicV1Nodes.push(sub);
      });
    }

    // Layer 2: Snare/clap on 2 and 4
    for (let measure = 0; measure < Math.ceil(duration / measureLength); measure++) {
      [1, 3].forEach(beat => {
        const time = startTime + measure * measureLength + beat * beatLength;
        if (time >= startTime + duration) return;

        const snare = this.createWhiteNoise(ctx);
        const snareGain = ctx.createGain();
        const snareFilter = ctx.createBiquadFilter();

        snare.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(rhythmGain);

        snareFilter.type = 'bandpass';
        snareFilter.frequency.value = 3000;
        snareFilter.Q.value = 2;

        snareGain.gain.setValueAtTime(0.15, time);
        snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        snare.start(time);
        snare.stop(time + 0.1);
        this.miningMusicV1Nodes.push(snare);
      });
    }

    // Layer 3: Complex hi-hat pattern
    const hihatPattern = [0, 0.25, 0.5, 0.625, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.125, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.625, 3.75];

    for (let measure = 0; measure < Math.ceil(duration / measureLength); measure++) {
      hihatPattern.forEach((beat, index) => {
        const time = startTime + measure * measureLength + beat * beatLength;
        if (time >= startTime + duration) return;

        const hihat = ctx.createOscillator();
        const hihatGain = ctx.createGain();
        const hihatFilter = ctx.createBiquadFilter();

        hihat.connect(hihatFilter);
        hihatFilter.connect(hihatGain);
        hihatGain.connect(rhythmGain);

        hihat.type = 'square';
        hihat.frequency.value = 8000 + Math.random() * 2000;

        hihatFilter.type = 'highpass';
        hihatFilter.frequency.value = 7000;

        // Varying velocities for groove
        const velocity = (index % 4 === 0) ? 0.08 : (index % 2 === 0 ? 0.05 : 0.03);
        hihatGain.gain.setValueAtTime(velocity, time);
        hihatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        hihat.start(time);
        hihat.stop(time + 0.05);
        this.miningMusicV1Nodes.push(hihat);
      });
    }

    // Layer 4: Tambourine shaker for extra groove
    for (let beat = 0; beat < duration / beatLength; beat++) {
      if (beat % 2 === 1) { // Off-beats only
        const time = startTime + beat * beatLength;
        if (time >= startTime + duration) return;

        const shaker = this.createWhiteNoise(ctx);
        const shakerGain = ctx.createGain();
        const shakerFilter = ctx.createBiquadFilter();

        shaker.connect(shakerFilter);
        shakerFilter.connect(shakerGain);
        shakerGain.connect(rhythmGain);

        shakerFilter.type = 'bandpass';
        shakerFilter.frequency.value = 10000;
        shakerFilter.Q.value = 5;

        shakerGain.gain.setValueAtTime(0.02, time);
        shakerGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        shaker.start(time);
        shaker.stop(time + 0.03);
        this.miningMusicV1Nodes.push(shaker);
      }
    }
  }

  private createMiningV1CatchyMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.35, startTime); // Slightly louder for slower tempo
    melodyGain.connect(masterGain);

    // Catchy pentatonic melody in D major (D, E, F#, A, B)
    // Main melody line with question-answer phrasing
    const melodyNotes = [
      // Phrase 1 - Question (4 bars)
      { freq: 293.66, start: 0, dur: 0.5 },      // D4
      { freq: 329.63, start: 0.5, dur: 0.5 },    // E4
      { freq: 369.99, start: 1, dur: 0.5 },      // F#4
      { freq: 440, start: 1.5, dur: 0.5 },       // A4
      { freq: 369.99, start: 2, dur: 1 },        // F#4 (hold)
      { freq: 329.63, start: 3, dur: 0.5 },      // E4
      { freq: 293.66, start: 3.5, dur: 0.5 },    // D4

      // Phrase 2 - Answer (4 bars)
      { freq: 493.88, start: 4, dur: 0.5 },      // B4
      { freq: 440, start: 4.5, dur: 0.5 },       // A4
      { freq: 369.99, start: 5, dur: 0.5 },      // F#4
      { freq: 440, start: 5.5, dur: 0.5 },       // A4
      { freq: 493.88, start: 6, dur: 1 },        // B4 (hold)
      { freq: 587.33, start: 7, dur: 0.5 },      // D5
      { freq: 493.88, start: 7.5, dur: 0.5 },    // B4

      // Phrase 3 - Development (4 bars)
      { freq: 440, start: 8, dur: 0.25 },        // A4
      { freq: 493.88, start: 8.25, dur: 0.25 },  // B4
      { freq: 587.33, start: 8.5, dur: 0.5 },    // D5
      { freq: 659.25, start: 9, dur: 0.5 },      // E5
      { freq: 587.33, start: 9.5, dur: 0.5 },    // D5
      { freq: 493.88, start: 10, dur: 0.5 },     // B4
      { freq: 440, start: 10.5, dur: 0.5 },      // A4
      { freq: 369.99, start: 11, dur: 1 },       // F#4

      // Phrase 4 - Resolution (4 bars)
      { freq: 329.63, start: 12, dur: 0.5 },     // E4
      { freq: 369.99, start: 12.5, dur: 0.5 },   // F#4
      { freq: 440, start: 13, dur: 0.5 },        // A4
      { freq: 369.99, start: 13.5, dur: 0.5 },   // F#4
      { freq: 329.63, start: 14, dur: 0.5 },     // E4
      { freq: 293.66, start: 14.5, dur: 1.5 },   // D4 (resolve)
    ];

    // Play melody with adjusted timing for 85 BPM (0.706s per beat)
    const beatLength = 0.706;
    for (let repeat = 0; repeat < Math.floor(duration / (16 * beatLength)); repeat++) {
      melodyNotes.forEach(note => {
        const time = startTime + repeat * 16 * beatLength + note.start * beatLength;
        if (time >= startTime + duration) return;

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const vibrato = ctx.createOscillator();
        const vibratoGain = ctx.createGain();

        // Add slight vibrato for warmth
        vibrato.frequency.value = 4;
        vibratoGain.gain.value = 2;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);

        osc.connect(noteGain);
        noteGain.connect(melodyGain);

        osc.type = 'triangle'; // Soft, warm tone
        osc.frequency.setValueAtTime(note.freq, time);

        // Envelope adjusted for slower tempo
        noteGain.gain.setValueAtTime(0, time);
        noteGain.gain.linearRampToValueAtTime(0.3, time + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.15, time + note.dur * beatLength - 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, time + note.dur * beatLength);

        vibrato.start(time);
        osc.start(time);
        vibrato.stop(time + note.dur * 0.5);
        osc.stop(time + note.dur * 0.5);

        this.miningMusicV1Nodes.push(osc, vibrato);
      });
    }
  }

  private createMiningV1PanPipes(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const pipesGain = ctx.createGain();
    pipesGain.gain.setValueAtTime(0.25, startTime);
    pipesGain.connect(masterGain);

    // Pan pipes play a counter-melody/harmony
    const pipeNotes = [
      // Harmonizing with main melody
      { freq: 587.33, start: 2, dur: 1 },     // D5
      { freq: 659.25, start: 3, dur: 1 },     // E5
      { freq: 739.99, start: 4, dur: 1 },     // F#5
      { freq: 659.25, start: 5, dur: 1 },     // E5
      { freq: 587.33, start: 6, dur: 2 },     // D5
      { freq: 880, start: 8, dur: 0.5 },      // A5
      { freq: 739.99, start: 8.5, dur: 0.5 }, // F#5
      { freq: 659.25, start: 9, dur: 1 },     // E5
      { freq: 587.33, start: 10, dur: 2 },    // D5
      { freq: 493.88, start: 12, dur: 1 },    // B4
      { freq: 440, start: 13, dur: 1 },       // A4
      { freq: 493.88, start: 14, dur: 1 },    // B4
      { freq: 587.33, start: 15, dur: 1 },    // D5
    ];

    const beatLength = 0.706; // 85 BPM
    for (let repeat = 0; repeat < Math.floor(duration / (16 * beatLength)); repeat++) {
      pipeNotes.forEach(note => {
        const time = startTime + repeat * 16 * beatLength + note.start * beatLength;
        if (time >= startTime + duration) return;

        // Create breathy pan pipe sound with multiple harmonics
        const fundamental = ctx.createOscillator();
        const octave = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        fundamental.connect(filter);
        octave.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(pipesGain);

        fundamental.type = 'sine';
        fundamental.frequency.value = note.freq;

        octave.type = 'sine';
        octave.frequency.value = note.freq * 2;

        // Breathy filter
        filter.type = 'bandpass';
        filter.frequency.value = note.freq * 2;
        filter.Q.value = 1;

        // Soft attack for pan pipe character
        noteGain.gain.setValueAtTime(0, time);
        noteGain.gain.linearRampToValueAtTime(0.2, time + 0.1);
        noteGain.gain.setValueAtTime(0.2, time + note.dur * beatLength - 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, time + note.dur * beatLength);

        fundamental.start(time);
        octave.start(time);
        fundamental.stop(time + note.dur * beatLength);
        octave.stop(time + note.dur * beatLength);

        this.miningMusicV1Nodes.push(fundamental, octave);
      });
    }
  }

  private createMiningV1Piano(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const pianoGain = ctx.createGain();
    pianoGain.gain.setValueAtTime(0.25, startTime);
    pianoGain.connect(masterGain);

    // Piano plays arpeggiated chords
    // D - G - A - D progression
    const chordProgressions = [
      { root: 146.83, third: 184.99, fifth: 220, start: 0 },    // D3 major
      { root: 196, third: 246.94, fifth: 293.66, start: 4 },     // G3 major
      { root: 220, third: 277.18, fifth: 329.63, start: 8 },     // A3 major
      { root: 146.83, third: 184.99, fifth: 220, start: 12 },    // D3 major
    ];

    const beatLength = 0.706; // 85 BPM
    for (let repeat = 0; repeat < Math.floor(duration / (16 * beatLength)); repeat++) {
      chordProgressions.forEach(chord => {
        // Arpeggiate each chord
        const arpPattern = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5];
        const notes = [chord.root, chord.third, chord.fifth, chord.third];

        arpPattern.forEach((timing, index) => {
          const time = startTime + repeat * 16 * beatLength + (chord.start + timing) * beatLength;
          if (time >= startTime + duration) return;

          const note = notes[index % notes.length];
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();

          osc.connect(noteGain);
          noteGain.connect(pianoGain);

          osc.type = 'sine'; // Piano-like tone
          osc.frequency.value = note;

          // Piano-like envelope with slightly longer sustain for slower tempo
          noteGain.gain.setValueAtTime(0, time);
          noteGain.gain.linearRampToValueAtTime(0.15, time + 0.01);
          noteGain.gain.exponentialRampToValueAtTime(0.05, time + 0.15);
          noteGain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

          osc.start(time);
          osc.stop(time + 0.4);
          this.miningMusicV1Nodes.push(osc);
        });
      });
    }
  }

  private createMiningV1AmbientWash(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const washGain = ctx.createGain();
    washGain.gain.setValueAtTime(0.15, startTime);
    washGain.connect(masterGain);

    // Create mystical ambient pad
    const frequencies = [146.83, 220, 293.66, 369.99, 440]; // D major pentatonic

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(padGain);

      osc.type = 'sine';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;

      // Slow fade in and sustain
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 5);
      gain.gain.setValueAtTime(0.05, startTime + duration - 5);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      // Add subtle detuning for richness
      osc.detune.value = (index - 2) * 5;

      osc.start(startTime);
      osc.stop(startTime + duration);
      this.miningMusicV1Nodes.push(osc);
    });
  }

  public stopMiningMusicV1() {
    this.miningMusicV1Playing = false;
    this.miningMusicV1Nodes.forEach(node => {
      try {
        if (node.stop) node.stop();
      } catch (e) {}
    });
    this.miningMusicV1Nodes = [];
  }

  /**
   * ROGUELIKE MUSIC - Beat-heavy track in G minor with ambient synth washes
   * Slow tempo, emphasis on rhythm, minimal melodic content
   * Used as alternate track in both mining and ruins roguelike maps
   */
  private roguelikeMusicNodes: AudioNode[] = [];
  private roguelikeMusicPlaying = false;

  /**
   * ROGUELIKE MUSIC ORCHESTRATOR - Manages alternating music tracks with silence periods
   */
  private roguelikeOrchestrator: {
    isActive: boolean;
    currentTrack: 'primary' | 'roguelike' | 'silence';
    loopCount: number;
    targetLoops: number;
    silenceTimer?: NodeJS.Timeout;
    trackTimer?: NodeJS.Timeout;
    primaryMusicCallback?: () => void;
    primaryStopCallback?: () => void;
    primaryLoopDuration?: number;
  } = {
    isActive: false,
    currentTrack: 'silence',
    loopCount: 0,
    targetLoops: 0
  };

  public playRoguelikeMusic() {
    if (this.isMuted || this.roguelikeMusicPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.roguelikeMusicPlaying = true;
      this.roguelikeMusicNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 40; // 40 second loop for hypnotic repetition

      // Master gain with smooth fade-in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.14 * this.masterVolume, now + 3);
      masterGain.connect(ctx.destination);
      this.roguelikeMusicNodes.push(masterGain);

      // Create all layers - beat-heavy with minimal melody
      this.createRoguelikeHeavyBeat(ctx, now, loopDuration, masterGain);
      this.createRoguelikeAmbientSynth(ctx, now, loopDuration, masterGain);
      this.createRoguelikeMinimalMelody(ctx, now, loopDuration, masterGain);
      this.createRoguelikeDeepBass(ctx, now, loopDuration, masterGain);
      this.createRoguelikeAtmosphericPad(ctx, now, loopDuration, masterGain);

      // Loop continuously
      const loopRoguelike = () => {
        if (this.roguelikeMusicPlaying) {
          setTimeout(() => {
            if (this.roguelikeMusicPlaying) {
              // Clear old nodes except master
              this.roguelikeMusicNodes = this.roguelikeMusicNodes.filter(node => node === masterGain);
              const loopTime = ctx.currentTime;

              this.createRoguelikeHeavyBeat(ctx, loopTime, loopDuration, masterGain);
              this.createRoguelikeAmbientSynth(ctx, loopTime, loopDuration, masterGain);
              this.createRoguelikeMinimalMelody(ctx, loopTime, loopDuration, masterGain);
              this.createRoguelikeDeepBass(ctx, loopTime, loopDuration, masterGain);
              this.createRoguelikeAtmosphericPad(ctx, loopTime, loopDuration, masterGain);

              loopRoguelike();
            }
          }, loopDuration * 1000);
        }
      };
      loopRoguelike();
    } catch (error) {
      console.error('Error playing roguelike music:', error);
      this.roguelikeMusicPlaying = false;
    }
  }

  private createRoguelikeHeavyBeat(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const rhythmGain = ctx.createGain();
    rhythmGain.gain.setValueAtTime(0.7, startTime); // MUCH louder beat - dominant element
    rhythmGain.connect(masterGain);

    // Heavy beat at 65 BPM - even slower than V1
    const beatLength = 60 / 65; // 0.923 seconds per beat

    // MASSIVE kick pattern - heavy and complex
    const kickPattern = [0, 0.5, 1, 2.75, 3, 4, 4.5, 5.5, 6, 7, 7.25, 7.5]; // Complex syncopation

    for (let measure = 0; measure < Math.ceil(duration / (beatLength * 8)); measure++) {
      kickPattern.forEach((beat, index) => {
        const time = startTime + measure * beatLength * 8 + beat * beatLength;
        if (time >= startTime + duration) return;

        // Layer 1: Deep sub-bass kick
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        const kickFilter = ctx.createBiquadFilter();

        kick.connect(kickFilter);
        kickFilter.connect(kickGain);
        kickGain.connect(rhythmGain);

        // Vary the pitch for interest
        const basePitch = index % 4 === 0 ? 45 : 50;
        kick.frequency.setValueAtTime(basePitch, time);
        kick.frequency.exponentialRampToValueAtTime(25, time + 0.3);

        kickFilter.type = 'lowpass';
        kickFilter.frequency.value = 120;
        kickFilter.Q.value = 5;

        const velocity = index % 4 === 0 ? 0.5 : 0.35;
        kickGain.gain.setValueAtTime(velocity, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

        kick.start(time);
        kick.stop(time + 0.4);
        this.roguelikeMusicNodes.push(kick);

        // Layer 2: Click/punch layer for definition
        const punch = ctx.createOscillator();
        const punchGain = ctx.createGain();
        punch.connect(punchGain);
        punchGain.connect(rhythmGain);

        punch.frequency.value = 150;
        punch.type = 'square';

        punchGain.gain.setValueAtTime(velocity * 0.3, time);
        punchGain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        punch.start(time);
        punch.stop(time + 0.05);
        this.roguelikeMusicNodes.push(punch);
      });

      // Heavy industrial snare on 2 and 6
      [2, 6].forEach((beat, index) => {
        const time = startTime + measure * beatLength * 8 + beat * beatLength;
        if (time >= startTime + duration) return;

        // Layer 1: Noise snare
        const snare = this.createWhiteNoise(ctx);
        const snareGain = ctx.createGain();
        const snareFilter = ctx.createBiquadFilter();

        snare.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(rhythmGain);

        snareFilter.type = 'bandpass';
        snareFilter.frequency.value = 3000;
        snareFilter.Q.value = 2;

        snareGain.gain.setValueAtTime(0.25, time);
        snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

        snare.start(time);
        snare.stop(time + 0.2);
        this.roguelikeMusicNodes.push(snare);

        // Layer 2: Tonal component for body
        const tone = ctx.createOscillator();
        const toneGain = ctx.createGain();
        tone.connect(toneGain);
        toneGain.connect(rhythmGain);

        tone.frequency.value = 200;
        tone.type = 'triangle';

        toneGain.gain.setValueAtTime(0.15, time);
        toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

        tone.start(time);
        tone.stop(time + 0.15);
        this.roguelikeMusicNodes.push(tone);
      });

      // Industrial hi-hat pattern
      const hihatPattern = [0, 0.5, 1, 1.25, 1.5, 2, 2.5, 3, 3.5, 4, 4.25, 4.5, 5, 5.5, 6, 6.5, 7, 7.5];

      hihatPattern.forEach((beat, index) => {
        const time = startTime + measure * beatLength * 8 + beat * beatLength;
        if (time >= startTime + duration) return;

        const hihat = ctx.createOscillator();
        const hihatGain = ctx.createGain();
        const hihatFilter = ctx.createBiquadFilter();

        hihat.connect(hihatFilter);
        hihatFilter.connect(hihatGain);
        hihatGain.connect(rhythmGain);

        hihat.type = 'square';
        hihat.frequency.value = 9000 + Math.random() * 3000;

        hihatFilter.type = 'highpass';
        hihatFilter.frequency.value = 8000;

        // Accented pattern
        const velocity = (index % 4 === 0) ? 0.12 : (index % 2 === 0 ? 0.08 : 0.05);
        hihatGain.gain.setValueAtTime(velocity, time);
        hihatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

        hihat.start(time);
        hihat.stop(time + 0.03);
        this.roguelikeMusicNodes.push(hihat);
      });
    }

    // Add tambourine-like sparkles
    for (let i = 0; i < duration * 4; i++) {
      const time = startTime + i * 0.25 + Math.random() * 0.05;
      if (time >= startTime + duration) return;

      if (Math.random() > 0.7) {
        const shaker = ctx.createOscillator();
        const shakerGain = ctx.createGain();
        const shakerFilter = ctx.createBiquadFilter();

        shaker.connect(shakerFilter);
        shakerFilter.connect(shakerGain);
        shakerGain.connect(rhythmGain);

        shaker.type = 'square';
        shaker.frequency.value = 6000 + Math.random() * 4000;

        shakerFilter.type = 'highpass';
        shakerFilter.frequency.value = 5000;

        shakerGain.gain.setValueAtTime(0.02, time);
        shakerGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        shaker.start(time);
        shaker.stop(time + 0.02);
        this.roguelikeMusicNodes.push(shaker);
      }
    }
  }

  private createRoguelikeAmbientSynth(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.25, startTime); // Softer for ambient feel
    melodyGain.connect(masterGain);

    // G minor ambient synth washes - slowly evolving pads
    // Very sparse, atmospheric, focusing on texture over melody
    const beatLength = 60 / 65; // Match the beat tempo

    // Create long, evolving ambient pads
    const padFrequencies = [
      98,     // G2 - sub bass
      146.83, // D3
      196,    // G3
      233.08, // Bb3
      261.63, // C4
      349.23, // F4
      392,    // G4
    ];

    padFrequencies.forEach((baseFreq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // Set up LFO for subtle pitch modulation
      lfo.frequency.value = 0.1 + index * 0.05; // Very slow modulation
      lfoGain.gain.value = 3; // Subtle pitch drift
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(synthGain);

      osc.type = 'sine';
      osc.frequency.value = baseFreq;

      // Detuning for richness
      osc.detune.value = (index - 3) * 8;

      // Filter for warmth
      filter.type = 'lowpass';
      filter.frequency.value = 800 + index * 100;
      filter.Q.value = 0.5;

      // Very slow fade in and out
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.05, startTime + 10 + index * 2);
      gain.gain.setValueAtTime(0.05, startTime + duration - 10);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      lfo.start(startTime);
      osc.start(startTime);
      lfo.stop(startTime + duration);
      osc.stop(startTime + duration);

      this.roguelikeMusicNodes.push(osc, lfo);
    });

    // Add some slow, sparse high frequency sweeps for atmosphere
    for (let i = 0; i < 3; i++) {
      const sweepTime = startTime + i * 12 + Math.random() * 4;
      if (sweepTime >= startTime + duration - 5) continue;

      const sweep = ctx.createOscillator();
      const sweepGain = ctx.createGain();
      const sweepFilter = ctx.createBiquadFilter();

      sweep.connect(sweepFilter);
      sweepFilter.connect(sweepGain);
      sweepGain.connect(synthGain);

      sweep.type = 'sine';
      sweep.frequency.setValueAtTime(800, sweepTime);
      sweep.frequency.exponentialRampToValueAtTime(1600, sweepTime + 4);
      sweep.frequency.exponentialRampToValueAtTime(400, sweepTime + 8);

      sweepFilter.type = 'bandpass';
      sweepFilter.frequency.value = 1200;
      sweepFilter.Q.value = 5;

      sweepGain.gain.setValueAtTime(0, sweepTime);
      sweepGain.gain.linearRampToValueAtTime(0.03, sweepTime + 2);
      sweepGain.gain.setValueAtTime(0.03, sweepTime + 6);
      sweepGain.gain.linearRampToValueAtTime(0, sweepTime + 8);

      sweep.start(sweepTime);
      sweep.stop(sweepTime + 8);

      this.roguelikeMusicNodes.push(sweep);
    }
  }

  private createRoguelikeMinimalMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.15, startTime); // Very quiet, sparse melody
    melodyGain.connect(masterGain);

    // Very sparse, minimal melody - just occasional notes
    // G minor pentatonic for dark feel
    const beatLength = 60 / 65;

    // Just a few lonely notes every 8 bars
    const minimalNotes = [
      { freq: 196, time: 0, dur: 4 },        // G3 - long, lonely note
      { freq: 233.08, time: 8, dur: 2 },     // Bb3
      { freq: 261.63, time: 12, dur: 1 },    // C4
      { freq: 196, time: 16, dur: 4 },       // G3
      { freq: 174.61, time: 24, dur: 2 },    // F3
      { freq: 146.83, time: 28, dur: 4 },    // D3
      { freq: 196, time: 32, dur: 6 },       // G3 - extra long
    ];

    minimalNotes.forEach(note => {
      const time = startTime + note.time * beatLength;
      if (time >= startTime + duration) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(melodyGain);

      osc.type = 'sine';
      osc.frequency.value = note.freq;

      // Heavy filtering for distant feel
      filter.type = 'lowpass';
      filter.frequency.value = 600;
      filter.Q.value = 2;

      // Slow attack and decay
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.1, time + 0.5);
      gain.gain.setValueAtTime(0.1, time + note.dur * beatLength - 1);
      gain.gain.exponentialRampToValueAtTime(0.001, time + note.dur * beatLength);

      osc.start(time);
      osc.stop(time + note.dur * beatLength);
      this.roguelikeMusicNodes.push(osc);
    });
  }

  private createRoguelikeDeepBass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.5, startTime); // Strong bass presence
    bassGain.connect(masterGain);

    // Deep, powerful bass line in G minor
    // Simple but heavy pattern to support the beat
    const beatLength = 60 / 65;

    // Sub-bass pattern that follows the kick drum
    const bassPattern = [
      { note: 49, time: 0, dur: 0.5 },       // G1 - ultra deep
      { note: 49, time: 0.5, dur: 0.5 },
      { note: 49, time: 1, dur: 0.75 },
      { note: 58.27, time: 2.75, dur: 0.25 }, // Bb1
      { note: 49, time: 3, dur: 1 },         // G1
      { note: 49, time: 4, dur: 0.5 },
      { note: 49, time: 4.5, dur: 0.5 },
      { note: 43.65, time: 5.5, dur: 0.5 },  // F1
      { note: 49, time: 6, dur: 1 },         // G1
      { note: 49, time: 7, dur: 0.25 },
      { note: 58.27, time: 7.25, dur: 0.25 }, // Bb1
      { note: 49, time: 7.5, dur: 0.5 },     // G1
    ];

    // Play bass pattern for entire duration
    for (let cycle = 0; cycle < Math.ceil(duration / (8 * beatLength)); cycle++) {
      bassPattern.forEach(({ note, time, dur }) => {
        const actualTime = startTime + cycle * 8 * beatLength + time * beatLength;
        if (actualTime >= startTime + duration) return;

        // Layer 1: Sub-bass sine wave
        const sub = ctx.createOscillator();
        const subGain = ctx.createGain();
        const subFilter = ctx.createBiquadFilter();

        sub.connect(subFilter);
        subFilter.connect(subGain);
        subGain.connect(bassGain);

        sub.type = 'sine';
        sub.frequency.value = note;

        subFilter.type = 'lowpass';
        subFilter.frequency.value = 80;
        subFilter.Q.value = 5;

        subGain.gain.setValueAtTime(0.4, actualTime);
        subGain.gain.setValueAtTime(0.4, actualTime + dur * beatLength - 0.05);
        subGain.gain.exponentialRampToValueAtTime(0.001, actualTime + dur * beatLength);

        sub.start(actualTime);
        sub.stop(actualTime + dur * beatLength);
        this.roguelikeMusicNodes.push(sub);

        // Layer 2: Octave above for definition
        const octave = ctx.createOscillator();
        const octaveGain = ctx.createGain();

        octave.connect(octaveGain);
        octaveGain.connect(bassGain);

        octave.type = 'triangle';
        octave.frequency.value = note * 2;

        octaveGain.gain.setValueAtTime(0.15, actualTime);
        octaveGain.gain.setValueAtTime(0.15, actualTime + dur * beatLength - 0.05);
        octaveGain.gain.exponentialRampToValueAtTime(0.001, actualTime + dur * beatLength);

        octave.start(actualTime);
        octave.stop(actualTime + dur * beatLength);
        this.roguelikeMusicNodes.push(octave);
      });
    }
  }

  private createRoguelikeAtmosphericPad(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.25, startTime); // Atmospheric background
    padGain.connect(masterGain);

    // Create dark atmospheric pad in G minor
    const padFreqs = [98, 146.83, 196, 233.08, 293.66, 349.23]; // G minor chord tones

    padFreqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      // LFO for filter movement
      lfo.frequency.value = 0.2 + index * 0.05;
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(padGain);

      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (index - 3) * 7; // Slight detuning for richness

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, startTime);
      filter.Q.value = 1;

      // Slow evolving envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.06, startTime + 8);
      gain.gain.setValueAtTime(0.06, startTime + duration - 8);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      lfo.start(startTime);
      osc.start(startTime);
      lfo.stop(startTime + duration);
      osc.stop(startTime + duration);
      this.roguelikeMusicNodes.push(osc, lfo);
    });
  }

  public stopRoguelikeMusic() {
    this.roguelikeMusicPlaying = false;
    this.roguelikeMusicNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
      } catch (e) {}
    });
    this.roguelikeMusicNodes = [];
  }

  /**
   * Start the roguelike music orchestrator for alternating tracks
   * @param primaryMusicCallback - Function to start the primary music (mining or ruins)
   * @param primaryStopCallback - Function to stop the primary music
   * @param primaryLoopDuration - Duration of primary music loop in ms (default 32000)
   */
  public startRoguelikeOrchestrator(
    primaryMusicCallback: () => void,
    primaryStopCallback: () => void,
    primaryLoopDuration: number = 32000
  ) {
    if (this.roguelikeOrchestrator.isActive) return;

    this.roguelikeOrchestrator = {
      isActive: true,
      currentTrack: 'silence',
      loopCount: 0,
      targetLoops: 0,
      primaryMusicCallback,
      primaryStopCallback,
      primaryLoopDuration
    };

    // Start with 20 seconds of silence (ambient only)
    this.scheduleNextMusicPhase(20000);
  }

  /**
   * Schedule the next phase of music (primary, roguelike, or silence)
   */
  private scheduleNextMusicPhase(delay: number) {
    if (!this.roguelikeOrchestrator.isActive) return;

    this.roguelikeOrchestrator.trackTimer = setTimeout(() => {
      if (!this.roguelikeOrchestrator.isActive) return;

      // Determine what to play next
      if (this.roguelikeOrchestrator.currentTrack === 'silence') {
        // After silence, play primary music
        this.roguelikeOrchestrator.currentTrack = 'primary';
        this.roguelikeOrchestrator.targetLoops = Math.floor(Math.random() * 5) + 1; // 1-5 loops
        this.roguelikeOrchestrator.loopCount = 0;

        if (this.roguelikeOrchestrator.primaryMusicCallback) {
          this.roguelikeOrchestrator.primaryMusicCallback();
        }

        // Primary music loop duration
        this.checkMusicLoopCompletion(this.roguelikeOrchestrator.primaryLoopDuration || 32000);

      } else if (this.roguelikeOrchestrator.currentTrack === 'primary') {
        // After primary, have silence then play roguelike
        if (this.roguelikeOrchestrator.primaryStopCallback) {
          this.roguelikeOrchestrator.primaryStopCallback();
        }

        this.roguelikeOrchestrator.currentTrack = 'silence';
        const silenceDuration = Math.random() * 45000 + 5000; // 5-50 seconds

        setTimeout(() => {
          if (!this.roguelikeOrchestrator.isActive) return;

          this.roguelikeOrchestrator.currentTrack = 'roguelike';
          this.roguelikeOrchestrator.targetLoops = Math.floor(Math.random() * 5) + 1; // 1-5 loops
          this.roguelikeOrchestrator.loopCount = 0;

          this.playRoguelikeMusic();

          // Roguelike music loop is 40 seconds
          this.checkMusicLoopCompletion(40000);
        }, silenceDuration);

      } else if (this.roguelikeOrchestrator.currentTrack === 'roguelike') {
        // After roguelike, have silence then play primary
        this.stopRoguelikeMusic();

        this.roguelikeOrchestrator.currentTrack = 'silence';
        const silenceDuration = Math.random() * 45000 + 5000; // 5-50 seconds

        setTimeout(() => {
          if (!this.roguelikeOrchestrator.isActive) return;

          this.roguelikeOrchestrator.currentTrack = 'primary';
          this.roguelikeOrchestrator.targetLoops = Math.floor(Math.random() * 5) + 1; // 1-5 loops
          this.roguelikeOrchestrator.loopCount = 0;

          if (this.roguelikeOrchestrator.primaryMusicCallback) {
            this.roguelikeOrchestrator.primaryMusicCallback();
          }

          // Primary music loop duration
          this.checkMusicLoopCompletion(this.roguelikeOrchestrator.primaryLoopDuration || 32000);
        }, silenceDuration);
      }
    }, delay);
  }

  /**
   * Check if the current music has completed its target loops
   */
  private checkMusicLoopCompletion(loopDuration: number) {
    if (!this.roguelikeOrchestrator.isActive) return;

    this.roguelikeOrchestrator.trackTimer = setTimeout(() => {
      if (!this.roguelikeOrchestrator.isActive) return;

      this.roguelikeOrchestrator.loopCount++;

      if (this.roguelikeOrchestrator.loopCount >= this.roguelikeOrchestrator.targetLoops) {
        // Completed target loops, move to next phase
        this.scheduleNextMusicPhase(0);
      } else {
        // Continue checking after next loop
        this.checkMusicLoopCompletion(loopDuration);
      }
    }, loopDuration);
  }

  /**
   * Stop the roguelike music orchestrator
   */
  public stopRoguelikeOrchestrator() {
    this.roguelikeOrchestrator.isActive = false;

    if (this.roguelikeOrchestrator.trackTimer) {
      clearTimeout(this.roguelikeOrchestrator.trackTimer);
    }
    if (this.roguelikeOrchestrator.silenceTimer) {
      clearTimeout(this.roguelikeOrchestrator.silenceTimer);
    }

    // Stop any playing music
    if (this.roguelikeOrchestrator.currentTrack === 'primary' && this.roguelikeOrchestrator.primaryStopCallback) {
      this.roguelikeOrchestrator.primaryStopCallback();
    } else if (this.roguelikeOrchestrator.currentTrack === 'roguelike') {
      this.stopRoguelikeMusic();
    }
  }

  /**
   * RUINS AUDIO ORCHESTRATOR - Manages cycling between soundscape, music, and silence
   */
  private ruinsOrchestrator: {
    isActive: boolean;
    currentPhase: 'soundscape' | 'short_silence' | 'music' | 'long_silence';
    timer?: NodeJS.Timeout;
  } = {
    isActive: false,
    currentPhase: 'soundscape',
    timer: undefined
  };

  /**
   * Start the ruins audio orchestrator that cycles between soundscape and music with silence periods
   * Pattern: Soundscape (1-2 min) → Silence (10-20s) → Music (loops) → Silence (1-2 min) → Repeat
   */
  public startRuinsOrchestrator() {
    if (this.ruinsOrchestrator.isActive) return;

    this.ruinsOrchestrator.isActive = true;
    this.ruinsOrchestrator.currentPhase = 'soundscape';

    // Start with cave/ruins soundscape
    this.playEnvironmentalSoundscape('RUINS');

    // Schedule first transition after 1-2 minutes
    const soundscapeDuration = Math.random() * 60000 + 60000; // 60-120 seconds
    this.scheduleRuinsPhaseChange(soundscapeDuration);
  }

  /**
   * Schedule the next phase change in the ruins orchestrator
   */
  private scheduleRuinsPhaseChange(delay: number) {
    if (!this.ruinsOrchestrator.isActive) return;

    this.ruinsOrchestrator.timer = setTimeout(() => {
      if (!this.ruinsOrchestrator.isActive) return;

      switch (this.ruinsOrchestrator.currentPhase) {
        case 'soundscape':
          // Stop soundscape, enter short silence
          this.stopEnvironmentalSoundscape();
          this.ruinsOrchestrator.currentPhase = 'short_silence';

          // Short silence: 10-20 seconds
          const shortSilence = Math.random() * 10000 + 10000; // 10-20 seconds
          this.scheduleRuinsPhaseChange(shortSilence);
          break;

        case 'short_silence':
          // Start dungeon music
          this.ruinsOrchestrator.currentPhase = 'music';
          this.playDungeonMusicSegment();

          // Music plays for random number of loops (2-4 loops of 48 seconds each)
          const musicLoops = Math.floor(Math.random() * 3) + 2; // 2-4 loops
          const musicDuration = musicLoops * 48000; // 48 seconds per loop
          this.scheduleRuinsPhaseChange(musicDuration);
          break;

        case 'music':
          // Stop music, enter long silence
          this.stopDungeonMusicWithRandomTiming();
          this.ruinsOrchestrator.currentPhase = 'long_silence';

          // Long silence: 1-2 minutes
          const longSilence = Math.random() * 60000 + 60000; // 60-120 seconds
          this.scheduleRuinsPhaseChange(longSilence);
          break;

        case 'long_silence':
          // Start soundscape again
          this.ruinsOrchestrator.currentPhase = 'soundscape';
          this.playEnvironmentalSoundscape('RUINS');

          // Soundscape duration: 1-2 minutes
          const soundscapeDuration = Math.random() * 60000 + 60000; // 60-120 seconds
          this.scheduleRuinsPhaseChange(soundscapeDuration);
          break;
      }
    }, delay);
  }

  /**
   * Stop the ruins orchestrator
   */
  public stopRuinsOrchestrator() {
    this.ruinsOrchestrator.isActive = false;

    if (this.ruinsOrchestrator.timer) {
      clearTimeout(this.ruinsOrchestrator.timer);
      this.ruinsOrchestrator.timer = undefined;
    }

    // Stop whatever is currently playing
    this.stopEnvironmentalSoundscape();
    this.stopDungeonMusicWithRandomTiming();
  }

  /**
   * CRYSTAL MUSIC - Catchy, fun crystal-themed music that fades in and out
   */
  private crystalMusicNodes: AudioNode[] = [];
  private crystalMusicPlaying = false;
  private crystalMusicGain: GainNode | null = null;

  public playCrystalMusic() {
    if (this.isMuted || this.crystalMusicPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.crystalMusicPlaying = true;
      this.crystalMusicNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 25; // 25 second loop

      // Create master gain with fade in
      this.crystalMusicGain = ctx.createGain();
      this.crystalMusicGain.gain.setValueAtTime(0, now);
      this.crystalMusicGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 3); // Fade in over 3 seconds
      this.crystalMusicGain.connect(ctx.destination);
      this.crystalMusicNodes.push(this.crystalMusicGain);

      // Create crystal music layers
      this.createCrystalBeat(ctx, now, loopDuration, this.crystalMusicGain);
      this.createCrystalMelody(ctx, now, loopDuration, this.crystalMusicGain);
      this.createCrystalBass(ctx, now, loopDuration, this.crystalMusicGain);
      this.createCrystalSparkles(ctx, now, loopDuration, this.crystalMusicGain);

      // Loop the music for 1-2 minutes then fade out
      let loopCount = 0;
      const maxLoops = 4; // About 100 seconds

      const loopCrystal = () => {
        if (this.crystalMusicPlaying && loopCount < maxLoops) {
          setTimeout(() => {
            if (this.crystalMusicPlaying) {
              loopCount++;

              if (loopCount === maxLoops - 1) {
                // Start fade out on last loop
                if (this.crystalMusicGain) {
                  this.crystalMusicGain.gain.linearRampToValueAtTime(0, ctx.currentTime + loopDuration);
                }
              }

              if (loopCount < maxLoops) {
                // Clear old nodes except master gain
                this.crystalMusicNodes = this.crystalMusicNodes.filter(node => node === this.crystalMusicGain);
                // Restart the loop
                this.createCrystalBeat(ctx, ctx.currentTime, loopDuration, this.crystalMusicGain!);
                this.createCrystalMelody(ctx, ctx.currentTime, loopDuration, this.crystalMusicGain!);
                this.createCrystalBass(ctx, ctx.currentTime, loopDuration, this.crystalMusicGain!);
                this.createCrystalSparkles(ctx, ctx.currentTime, loopDuration, this.crystalMusicGain!);
                loopCrystal();
              } else {
                // Stop after fade out
                setTimeout(() => this.stopCrystalMusic(), 1000);
              }
            }
          }, loopDuration * 1000);
        }
      };
      loopCrystal();

    } catch (error) {
      console.warn('Could not play crystal music:', error);
      this.crystalMusicPlaying = false;
    }
  }

  private createCrystalBeat(ctx: AudioContext, now: number, duration: number, output: AudioNode) {
    // Upbeat, catchy rhythm
    const beatGain = ctx.createGain();
    beatGain.gain.value = 0.5;
    beatGain.connect(output);

    const beatTime = 0.25; // Quarter second per beat for 120 BPM feel
    const pattern = [1, 0, 0.5, 0, 1, 0, 0.5, 0.5]; // Kick pattern

    for (let i = 0; i < duration / (beatTime * pattern.length) * pattern.length; i++) {
      const time = now + i * beatTime;
      const beatStrength = pattern[i % pattern.length];

      if (beatStrength > 0) {
        const kick = ctx.createOscillator();
        const kickGain = ctx.createGain();
        const kickFilter = ctx.createBiquadFilter();

        kick.type = 'sine';
        kick.frequency.value = 60;

        kickFilter.type = 'lowpass';
        kickFilter.frequency.value = 100;

        kick.connect(kickFilter);
        kickFilter.connect(kickGain);
        kickGain.connect(beatGain);

        kickGain.gain.setValueAtTime(0.2 * beatStrength, time);
        kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);

        kick.start(time);
        kick.stop(time + 0.1);

        this.crystalMusicNodes.push(kick, kickGain, kickFilter);
      }
    }

    this.crystalMusicNodes.push(beatGain);
  }

  private createCrystalMelody(ctx: AudioContext, now: number, duration: number, output: AudioNode) {
    // Catchy, playful crystal melody
    const melodyGain = ctx.createGain();
    melodyGain.gain.value = 0.35;
    melodyGain.connect(output);

    // Crystal-like reverb
    const convolver = ctx.createConvolver();
    const impulse = ctx.createBuffer(2, ctx.sampleRate * 0.5, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / channelData.length, 3);
      }
    }
    convolver.buffer = impulse;
    convolver.connect(melodyGain);

    // Catchy melody pattern (C major pentatonic)
    const melody = [
      [523, 0.25], [523, 0.25], [659, 0.25], [784, 0.25],  // C5 C5 E5 G5
      [880, 0.5], [784, 0.25], [659, 0.25],                // A5 G5 E5
      [523, 0.25], [659, 0.25], [784, 0.5],                // C5 E5 G5
      [1047, 0.5], [880, 0.25], [784, 0.25],               // C6 A5 G5
      [659, 0.25], [523, 0.25], [392, 0.25], [523, 0.25],  // E5 C5 G4 C5
      [659, 1.0],                                           // E5 (hold)
    ];

    let timeOffset = 0;
    const repetitions = Math.floor(duration / 6); // Repeat melody

    for (let rep = 0; rep < repetitions; rep++) {
      melody.forEach(([freq, dur]) => {
        const time = now + timeOffset;

        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        // Bell-like sine wave for crystal sound
        osc.type = 'sine';
        osc.frequency.value = freq;

        // Add slight vibrato for sparkle
        const vibrato = ctx.createOscillator();
        vibrato.type = 'sine';
        vibrato.frequency.value = 5;
        const vibratoGain = ctx.createGain();
        vibratoGain.gain.value = 8;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(osc.frequency);
        vibrato.start(time);
        vibrato.stop(time + dur);

        osc.connect(oscGain);
        oscGain.connect(convolver);

        oscGain.gain.setValueAtTime(0, time);
        oscGain.gain.linearRampToValueAtTime(0.15, time + 0.02);
        oscGain.gain.setValueAtTime(0.15, time + dur * 0.7);
        oscGain.gain.exponentialRampToValueAtTime(0.001, time + dur);

        osc.start(time);
        osc.stop(time + dur);

        timeOffset += dur;

        this.crystalMusicNodes.push(osc, oscGain, vibrato, vibratoGain);
      });
    }

    this.crystalMusicNodes.push(convolver, melodyGain);
  }

  private createCrystalBass(ctx: AudioContext, now: number, duration: number, output: AudioNode) {
    // Bouncy bass line
    const bassGain = ctx.createGain();
    bassGain.gain.value = 0.4;
    bassGain.connect(output);

    const bass = ctx.createOscillator();
    const bassFilter = ctx.createBiquadFilter();

    bass.type = 'sawtooth';
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 300;
    bassFilter.Q.value = 3;

    bass.connect(bassFilter);
    bassFilter.connect(bassGain);

    // Bouncy bass pattern (C major)
    const bassPattern = [
      130.81, 130.81, 164.81, 196,    // C3 C3 E3 G3
      130.81, 196, 164.81, 130.81     // C3 G3 E3 C3
    ];

    const noteLength = duration / (bassPattern.length * 2);

    for (let i = 0; i < bassPattern.length * 2; i++) {
      const time = now + i * noteLength;
      const note = bassPattern[i % bassPattern.length];
      bass.frequency.setValueAtTime(note, time);
      bass.frequency.linearRampToValueAtTime(note * 1.01, time + noteLength * 0.5);
    }

    bass.start(now);
    bass.stop(now + duration);

    this.crystalMusicNodes.push(bass, bassFilter, bassGain);
  }

  private createCrystalSparkles(ctx: AudioContext, now: number, duration: number, output: AudioNode) {
    // Random sparkle sounds
    const sparkleGain = ctx.createGain();
    sparkleGain.gain.value = 0.2;
    sparkleGain.connect(output);

    // Create sparkles throughout the duration
    for (let i = 0; i < duration * 2; i++) {
      const sparkleTime = now + Math.random() * duration;

      const sparkle = ctx.createOscillator();
      const sparkleEnv = ctx.createGain();

      sparkle.type = 'sine';
      // High frequency sparkles
      sparkle.frequency.value = 2000 + Math.random() * 2000;

      sparkle.connect(sparkleEnv);
      sparkleEnv.connect(sparkleGain);

      sparkleEnv.gain.setValueAtTime(0, sparkleTime);
      sparkleEnv.gain.linearRampToValueAtTime(0.08, sparkleTime + 0.01);
      sparkleEnv.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.2);

      sparkle.start(sparkleTime);
      sparkle.stop(sparkleTime + 0.2);

      this.crystalMusicNodes.push(sparkle, sparkleEnv);
    }

    this.crystalMusicNodes.push(sparkleGain);
  }

  public stopCrystalMusic() {
    this.crystalMusicNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.crystalMusicNodes = [];
    this.crystalMusicPlaying = false;
    this.crystalMusicGain = null;
  }

  /**
   * MINING SOUND EFFECTS
   */
  public playPickaxeHit() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Metallic impact
      const impact = ctx.createOscillator();
      const impactGain = ctx.createGain();
      const impactFilter = ctx.createBiquadFilter();

      impact.type = 'sawtooth';
      impact.frequency.value = 80 + Math.random() * 40;

      impactFilter.type = 'lowpass';
      impactFilter.frequency.value = 300;
      impactFilter.Q.value = 10;

      impact.connect(impactFilter);
      impactFilter.connect(impactGain);
      impactGain.connect(ctx.destination);

      impactGain.gain.setValueAtTime(0.2 * this.masterVolume, now);
      impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      impact.start(now);
      impact.stop(now + 0.15);

      // High frequency "tink"
      const tink = ctx.createOscillator();
      const tinkGain = ctx.createGain();

      tink.type = 'sine';
      tink.frequency.value = 1200 + Math.random() * 800;

      tink.connect(tinkGain);
      tinkGain.connect(ctx.destination);

      tinkGain.gain.setValueAtTime(0.1 * this.masterVolume, now);
      tinkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      tink.start(now);
      tink.stop(now + 0.05);

    } catch (error) {
      console.warn('Could not play pickaxe sound:', error);
    }
  }

  /**
   * ORE EXPOSURE SOUNDS - Play when ore is revealed
   */
  public playOreExposedSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Sparkle chime sound
      for (let i = 0; i < 3; i++) {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();

        chime.type = 'sine';
        chime.frequency.value = 800 + i * 400; // Ascending frequencies

        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);

        const startTime = now + i * 0.05;
        chimeGain.gain.setValueAtTime(0, startTime);
        chimeGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, startTime + 0.01);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

        chime.start(startTime);
        chime.stop(startTime + 0.3);
      }

      // Add a subtle "reveal" swoosh
      const swoosh = ctx.createOscillator();
      const swooshGain = ctx.createGain();
      const swooshFilter = ctx.createBiquadFilter();

      swoosh.type = 'sawtooth';
      swoosh.frequency.setValueAtTime(200, now);
      swoosh.frequency.exponentialRampToValueAtTime(1500, now + 0.2);

      swooshFilter.type = 'bandpass';
      swooshFilter.frequency.value = 1000;
      swooshFilter.Q.value = 2;

      swoosh.connect(swooshFilter);
      swooshFilter.connect(swooshGain);
      swooshGain.connect(ctx.destination);

      swooshGain.gain.setValueAtTime(0.05 * this.masterVolume, now);
      swooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      swoosh.start(now);
      swoosh.stop(now + 0.2);

    } catch (error) {
      console.warn('Could not play ore exposed sound:', error);
    }
  }

  public playGemExposedSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Magical ascending arpeggio
      const notes = [523, 659, 784, 1047, 1319]; // C5 E5 G5 C6 E6

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        // Add shimmer with second oscillator
        const shimmer = ctx.createOscillator();
        shimmer.type = 'sine';
        shimmer.frequency.value = freq * 2.01; // Slight detune for shimmer
        shimmer.connect(gain);

        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = now + i * 0.08;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, startTime + 0.02);
        gain.gain.setValueAtTime(0.12 * this.masterVolume, startTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

        osc.start(startTime);
        osc.stop(startTime + 0.8);
        shimmer.start(startTime);
        shimmer.stop(startTime + 0.8);
      });

      // Add magical sparkle burst
      for (let i = 0; i < 8; i++) {
        const sparkle = ctx.createOscillator();
        const sparkleGain = ctx.createGain();

        sparkle.type = 'sine';
        sparkle.frequency.value = 2000 + Math.random() * 3000;

        sparkle.connect(sparkleGain);
        sparkleGain.connect(ctx.destination);

        const sparkleTime = now + Math.random() * 0.5;
        sparkleGain.gain.setValueAtTime(0, sparkleTime);
        sparkleGain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, sparkleTime + 0.01);
        sparkleGain.gain.exponentialRampToValueAtTime(0.001, sparkleTime + 0.15);

        sparkle.start(sparkleTime);
        sparkle.stop(sparkleTime + 0.15);
      }

    } catch (error) {
      console.warn('Could not play gem exposed sound:', error);
    }
  }

  /**
   * MAGICAL PICKUP SOUND - Enhanced pickup sound for gems
   */
  public playMagicalPickup() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Magical bell sound
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();

      bell.type = 'sine';
      bell.frequency.value = 1047; // C6

      // Add harmonics
      const harmonic1 = ctx.createOscillator();
      harmonic1.type = 'sine';
      harmonic1.frequency.value = 2093; // C7
      const harmonic1Gain = ctx.createGain();
      harmonic1Gain.gain.value = 0.3;
      harmonic1.connect(harmonic1Gain);
      harmonic1Gain.connect(bellGain);

      const harmonic2 = ctx.createOscillator();
      harmonic2.type = 'sine';
      harmonic2.frequency.value = 3136; // G7
      const harmonic2Gain = ctx.createGain();
      harmonic2Gain.gain.value = 0.2;
      harmonic2.connect(harmonic2Gain);
      harmonic2Gain.connect(bellGain);

      bell.connect(bellGain);
      bellGain.connect(ctx.destination);

      bellGain.gain.setValueAtTime(0.15 * this.masterVolume, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

      bell.start(now);
      bell.stop(now + 1.5);
      harmonic1.start(now);
      harmonic1.stop(now + 1.5);
      harmonic2.start(now);
      harmonic2.stop(now + 1.5);

    } catch (error) {
      console.warn('Could not play magical pickup sound:', error);
    }
  }

  public playOreCollected() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Sparkly collection sound
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 800 * (1 + i * 0.5); // Rising frequencies

        osc.connect(gain);
        gain.connect(ctx.destination);

        const startTime = now + i * 0.05;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

        osc.start(startTime);
        osc.stop(startTime + 0.2);
      }

    } catch (error) {
      console.warn('Could not play ore collection sound:', error);
    }
  }

  /**
   * MINING - Ancient artifact discovery sound
   */
  public playAncientDiscoverySound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Deep mysterious drone
      const drone = ctx.createOscillator();
      const droneGain = ctx.createGain();
      const droneFilter = ctx.createBiquadFilter();

      drone.type = 'sawtooth';
      drone.frequency.value = 55; // Low A

      drone.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(ctx.destination);

      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 200;
      droneFilter.Q.value = 10;

      droneGain.gain.setValueAtTime(0, now);
      droneGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 0.3);
      droneGain.gain.setValueAtTime(0.12 * this.masterVolume, now + 1.0);
      droneGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

      drone.start(now);
      drone.stop(now + 1.8);

      // Ethereal chimes - ascending mystical notes
      const chimeNotes = [440, 554.37, 659.25, 880]; // A major chord
      chimeNotes.forEach((freq, index) => {
        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();

        chime.type = 'triangle';
        chime.frequency.value = freq * 2; // Higher octave

        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);

        const startTime = now + 0.2 + (index * 0.12);
        chimeGain.gain.setValueAtTime(0, startTime);
        chimeGain.gain.linearRampToValueAtTime(0.06 * this.masterVolume, startTime + 0.05);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);

        chime.start(startTime);
        chime.stop(startTime + 1.0);
      });

    } catch (error) {
      console.warn('Could not play ancient discovery sound:', error);
    }
  }

  /**
   * DUNGEON MUSIC WITH RANDOM TIMING - For roguelike gameplay
   */
  private dungeonRandomNodes: AudioNode[] = [];
  private dungeonRandomPlaying = false;
  private dungeonRandomTimeout: NodeJS.Timeout | null = null;

  public playDungeonMusicWithRandomTiming() {
    if (this.isMuted || this.dungeonRandomPlaying) return;
    
    this.dungeonRandomPlaying = true;
    this.startRandomDungeonCycle();
  }

  private startRandomDungeonCycle() {
    if (!this.dungeonRandomPlaying) return;
    
    // Random delay before music starts (5-20 seconds)
    const initialDelay = (5 + Math.random() * 15) * 1000;
    
    this.dungeonRandomTimeout = setTimeout(() => {
      if (!this.dungeonRandomPlaying) return;
      
      this.playDungeonMusicSegment();
    }, initialDelay);
  }

  public playDungeonMusicSegment() {
    // Allow direct calling from orchestrator
    if (!this.dungeonRandomPlaying) {
      this.dungeonRandomPlaying = true;
    }
    
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.dungeonRandomNodes = [];
      const now = ctx.currentTime;
      const segmentDuration = 48; // 48 seconds of music
      
      // Create master gain with fade-in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 3); // 3-second fade-in
      masterGain.connect(ctx.destination);
      this.dungeonRandomNodes.push(masterGain);

      // Create the same mysterious musical layers as regular dungeon music
      this.createSubtleDrums(ctx, now, segmentDuration, masterGain);
      this.createMysteriousBass(ctx, now, segmentDuration, masterGain);
      this.createEtherealPads(ctx, now, segmentDuration, masterGain);
      this.createHauntingMelody(ctx, now, segmentDuration, masterGain);
      this.createAmbientTextures(ctx, now, segmentDuration, masterGain);
      this.createCrystallineArpeggio(ctx, now, segmentDuration, masterGain);
      
      // Schedule fade-out near end
      setTimeout(() => {
        if (this.dungeonRandomPlaying && masterGain.gain) {
          masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
        }
      }, (segmentDuration - 2) * 1000);
      
      // Schedule next cycle with random silence period
      setTimeout(() => {
        if (this.dungeonRandomPlaying) {
          // Clean up current nodes
          this.dungeonRandomNodes.forEach(node => {
            try {
              if (node.stop) {
                node.stop();
              }
            } catch (e) {
              // Node may already be stopped
            }
          });
          this.dungeonRandomNodes = [];
          
          // Random silence period (5-20 seconds) then restart cycle
          const silenceDelay = (5 + Math.random() * 15) * 1000;
          this.dungeonRandomTimeout = setTimeout(() => {
            if (this.dungeonRandomPlaying) {
              this.playDungeonMusicSegment();
            }
          }, silenceDelay);
        }
      }, segmentDuration * 1000);
      
    } catch (error) {
      console.error('Error playing random dungeon music:', error);
      this.dungeonRandomPlaying = false;
    }
  }

  public stopDungeonMusicWithRandomTiming() {
    this.dungeonRandomPlaying = false;
    
    if (this.dungeonRandomTimeout) {
      clearTimeout(this.dungeonRandomTimeout);
      this.dungeonRandomTimeout = null;
    }
    
    this.dungeonRandomNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.dungeonRandomNodes = [];
  }

  /**
   * GOVERNMENT FORUM MUSIC - Complex Bach-like composition with authority
   */
  private governmentNodes: AudioNode[] = [];
  private governmentPlaying = false;

  public playGovernmentMusic() {
    if (this.isMuted || this.governmentPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.governmentPlaying = true;
      this.governmentNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 30; // 30 seconds per loop
      
      // Master gain with fade-in like FF6 style
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.16 * this.masterVolume, now + 5); // 5 second fade-in
      masterGain.connect(ctx.destination);
      this.governmentNodes.push(masterGain);

      // Create FF6-style musical layers
      this.createGovernmentBass(ctx, now, loopDuration, masterGain);
      this.createGovernmentDrums(ctx, now, loopDuration, masterGain);
      this.createGovernmentBrass(ctx, now, loopDuration, masterGain);
      this.createGovernmentStrings(ctx, now, loopDuration, masterGain);
      this.createGovernmentMelody(ctx, now, loopDuration, masterGain);
      
      // Schedule loop
      setTimeout(() => {
        if (this.governmentPlaying) {
          this.stopGovernmentMusic();
          this.playGovernmentMusic();
        }
      }, loopDuration * 1000);
      
    } catch (error) {
      console.error('Error playing government music:', error);
      this.governmentPlaying = false;
    }
  }

  private createGovernmentBass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.35, startTime);
    bassGain.connect(masterGain);

    // Much better progression: Dm - Bb - Gm - A (i-VI-iv-V in D minor)
    const bassNotes = [146.83, 116.54, 97.999, 110]; // D3, Bb2, G2, A2
    const noteLength = 1.5; // Slightly faster for more energy

    for (let i = 0; i < duration; i += noteLength) {
      const noteIndex = Math.floor(i / noteLength) % bassNotes.length;
      const bass = ctx.createOscillator();
      const noteGain = ctx.createGain();
      
      bass.connect(noteGain);
      noteGain.connect(bassGain);
      
      bass.type = 'sawtooth';
      bass.frequency.value = bassNotes[noteIndex];
      
      noteGain.gain.setValueAtTime(0.9, startTime + i);
      noteGain.gain.exponentialRampToValueAtTime(0.6, startTime + i + noteLength * 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + noteLength);
      
      bass.start(startTime + i);
      bass.stop(startTime + i + noteLength);
      this.governmentNodes.push(bass, noteGain);
    }
    
    this.governmentNodes.push(bassGain);
  }

  private createGovernmentDrums(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const drumGain = ctx.createGain();
    drumGain.gain.setValueAtTime(0.4, startTime);
    drumGain.connect(masterGain);
    
    const beatInterval = 0.5; // More driving 120 BPM
    
    for (let i = 0; i < duration; i += beatInterval) {
      const beat = Math.floor(i / beatInterval) % 4;
      
      if (beat === 0 || beat === 2) {
        // Powerful kick drum on 1 and 3
        this.createGovernmentKick(ctx, startTime + i, drumGain);
      }
      
      if (beat === 1 || beat === 3) {
        // Snare on 2 and 4
        this.createGovernmentSnare(ctx, startTime + i, drumGain);
      }
      
      // Add hi-hat on every beat for drive
      this.createGovernmentHiHat(ctx, startTime + i, drumGain);
    }
    
    this.governmentNodes.push(drumGain);
  }

  private createGovernmentHiHat(ctx: AudioContext, startTime: number, drumGain: GainNode) {
    const hihat = ctx.createOscillator();
    const hihatGain = ctx.createGain();
    const hihatFilter = ctx.createBiquadFilter();
    
    hihat.type = 'square';
    hihat.frequency.value = 8000;
    
    hihatFilter.type = 'highpass';
    hihatFilter.frequency.value = 6000;
    
    hihatGain.gain.setValueAtTime(0.2, startTime);
    hihatGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
    
    hihat.connect(hihatFilter);
    hihatFilter.connect(hihatGain);
    hihatGain.connect(drumGain);
    
    hihat.start(startTime);
    hihat.stop(startTime + 0.05);
    this.governmentNodes.push(hihat, hihatGain, hihatFilter);
  }

  private createGovernmentKick(ctx: AudioContext, startTime: number, drumGain: GainNode) {
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    const kickFilter = ctx.createBiquadFilter();
    
    kick.type = 'sine';
    kick.frequency.setValueAtTime(60, startTime);
    kick.frequency.exponentialRampToValueAtTime(30, startTime + 0.1);
    
    kickFilter.type = 'lowpass';
    kickFilter.frequency.value = 100;
    
    kickGain.gain.setValueAtTime(1.2, startTime);
    kickGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
    
    kick.connect(kickFilter);
    kickFilter.connect(kickGain);
    kickGain.connect(drumGain);
    
    kick.start(startTime);
    kick.stop(startTime + 0.3);
    this.governmentNodes.push(kick, kickGain, kickFilter);
  }

  private createGovernmentSnare(ctx: AudioContext, startTime: number, drumGain: GainNode) {
    const snare = ctx.createOscillator();
    const snareGain = ctx.createGain();
    const snareFilter = ctx.createBiquadFilter();
    
    snare.type = 'square';
    snare.frequency.value = 200;
    
    snareFilter.type = 'highpass';
    snareFilter.frequency.value = 1000;
    
    snareGain.gain.setValueAtTime(0.8, startTime);
    snareGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
    
    snare.connect(snareFilter);
    snareFilter.connect(snareGain);
    snareGain.connect(drumGain);
    
    snare.start(startTime);
    snare.stop(startTime + 0.1);
    this.governmentNodes.push(snare, snareGain, snareFilter);
  }

  private createGovernmentBrass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const brassGain = ctx.createGain();
    brassGain.gain.setValueAtTime(0.25, startTime);
    brassGain.connect(masterGain);

    // Heroic brass fanfares every 4 beats
    for (let i = 0; i < duration; i += 4) {
      const fanfareTime = startTime + i;
      
      // Trumpet call: D - F - A (Dm triad)
      const notes = [293.66, 349.23, 440];
      
      notes.forEach((freq, noteIndex) => {
        const trumpet = ctx.createOscillator();
        const trumpetGain = ctx.createGain();
        const trumpetFilter = ctx.createBiquadFilter();
        
        trumpet.type = 'sawtooth';
        trumpet.frequency.value = freq;
        
        trumpetFilter.type = 'bandpass';
        trumpetFilter.frequency.value = 1200;
        trumpetFilter.Q.value = 2;
        
        trumpetGain.gain.setValueAtTime(0, fanfareTime + noteIndex * 0.3);
        trumpetGain.gain.linearRampToValueAtTime(0.7, fanfareTime + noteIndex * 0.3 + 0.1);
        trumpetGain.gain.linearRampToValueAtTime(0.5, fanfareTime + noteIndex * 0.3 + 0.8);
        trumpetGain.gain.exponentialRampToValueAtTime(0.01, fanfareTime + noteIndex * 0.3 + 1.2);
        
        trumpet.connect(trumpetFilter);
        trumpetFilter.connect(trumpetGain);
        trumpetGain.connect(brassGain);
        
        trumpet.start(fanfareTime + noteIndex * 0.3);
        trumpet.stop(fanfareTime + noteIndex * 0.3 + 1.2);
        this.governmentNodes.push(trumpet, trumpetGain, trumpetFilter);
      });
    }
    
    this.governmentNodes.push(brassGain);
  }

  private createGovernmentStrings(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const stringGain = ctx.createGain();
    stringGain.gain.setValueAtTime(0.2, startTime);
    stringGain.connect(masterGain);

    // Sweeping string chords following the bass progression
    const chords = [
      [146.83, 220, 293.66, 349.23], // Dm: D-A-D-F
      [116.54, 174.61, 233.08, 293.66], // Bb: Bb-F-Bb-D
      [174.61, 261.63, 349.23, 440], // F: F-C-F-A
      [130.81, 196, 261.63, 329.63] // C: C-G-C-E
    ];

    for (let i = 0; i < duration; i += 8) {
      const chordIndex = Math.floor(i / 8) % chords.length;
      const chordTime = startTime + i;
      
      chords[chordIndex].forEach(freq => {
        const string = ctx.createOscillator();
        const stringGainNode = ctx.createGain();
        const stringFilter = ctx.createBiquadFilter();
        
        string.type = 'sawtooth';
        string.frequency.value = freq;
        
        stringFilter.type = 'lowpass';
        stringFilter.frequency.value = 800;
        stringFilter.Q.value = 1;
        
        stringGainNode.gain.setValueAtTime(0, chordTime);
        stringGainNode.gain.linearRampToValueAtTime(0.4, chordTime + 1);
        stringGainNode.gain.setValueAtTime(0.4, chordTime + 6);
        stringGainNode.gain.linearRampToValueAtTime(0.01, chordTime + 8);
        
        string.connect(stringFilter);
        stringFilter.connect(stringGainNode);
        stringGainNode.connect(stringGain);
        
        string.start(chordTime);
        string.stop(chordTime + 8);
        this.governmentNodes.push(string, stringGainNode, stringFilter);
      });
    }
    
    this.governmentNodes.push(stringGain);
  }

  private createGovernmentMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.3, startTime);
    melodyGain.connect(masterGain);

    // Memorable, powerful government theme - like FF6 Terra's Theme style
    const melody = [
      // First phrase (measures 1-2)
      { freq: 587.33, time: 0, length: 0.75 },    // D5
      { freq: 659.25, time: 0.75, length: 0.75 }, // E5
      { freq: 698.46, time: 1.5, length: 1.5 },   // F5 (longer)
      { freq: 659.25, time: 3, length: 0.75 },    // E5
      { freq: 587.33, time: 3.75, length: 1.25 }, // D5 (longer)
      
      // Second phrase (measures 3-4)
      { freq: 466.16, time: 6, length: 0.75 },    // Bb4
      { freq: 523.25, time: 6.75, length: 0.75 }, // C5
      { freq: 587.33, time: 7.5, length: 1.5 },   // D5 (longer)
      { freq: 523.25, time: 9, length: 0.75 },    // C5
      { freq: 466.16, time: 9.75, length: 1.25 }, // Bb4 (longer)
      
      // Climactic phrase (measures 5-6)
      { freq: 880, time: 12, length: 1 },         // A5 (high climax!)
      { freq: 783.99, time: 13, length: 0.5 },    // G5
      { freq: 698.46, time: 13.5, length: 0.5 },  // F5
      { freq: 659.25, time: 14, length: 1 },      // E5
      { freq: 587.33, time: 15, length: 3 },      // D5 (very long resolution)
      
      // Echo phrase (measures 7-8)
      { freq: 880, time: 18, length: 0.75 },      // A5 (echo the climax)
      { freq: 783.99, time: 18.75, length: 0.75 }, // G5
      { freq: 698.46, time: 19.5, length: 1.5 },  // F5
      { freq: 587.33, time: 21, length: 3 }       // D5 (final resolution)
    ];

    melody.forEach(note => {
      if (note.time < duration) {
        const noteTime = startTime + note.time;
        
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.value = note.freq;
        
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1.5;
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.9, noteTime + 0.05);
        noteGain.gain.linearRampToValueAtTime(0.7, noteTime + note.length * 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + note.length);
        
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(melodyGain);
        
        osc.start(noteTime);
        osc.stop(noteTime + note.length);
        this.governmentNodes.push(osc, noteGain, filter);
      }
    });
    
    this.governmentNodes.push(melodyGain);
  }

  public stopGovernmentMusic() {
    this.governmentNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Already stopped
      }
    });
    this.governmentNodes = [];
    this.governmentPlaying = false;
  }

  /**
   * ESTATES MUSIC - Solemn authority for elite leaders' abodes
   */
  private estatesNodes: AudioNode[] = [];
  private estatesPlaying = false;

  public playEstatesMusic() {
    if (this.isMuted || this.estatesPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.estatesPlaying = true;
      this.estatesNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 32; // 32 seconds per loop
      
      // Master gain with gentle fade-in like successful music
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.14 * this.masterVolume, now + 5); // 5 second fade-in
      masterGain.connect(ctx.destination);
      this.estatesNodes.push(masterGain);

      // Create orchestral estates theme with rich layering
      this.createEstatesWarmBass(ctx, now, loopDuration, masterGain);
      this.createEstatesGentleMelody(ctx, now, loopDuration, masterGain);
      this.createEstatesHarmonyPads(ctx, now, loopDuration, masterGain);
      this.createEstatesAmbientWash(ctx, now, loopDuration, masterGain); // New orchestral wash
      this.createEstatesArpeggio(ctx, now, loopDuration, masterGain);
      this.createEstatesAccents(ctx, now, loopDuration, masterGain);
      
      // Loop like the successful fishing music
      const loopEstates = () => {
        if (this.estatesPlaying) {
          setTimeout(() => {
            if (this.estatesPlaying) {
              // Clear old nodes but keep master gain
              this.estatesNodes = this.estatesNodes.filter(node => node === masterGain);
              // Restart the loop
              const loopTime = ctx.currentTime;
              this.createEstatesWarmBass(ctx, loopTime, loopDuration, masterGain);
              this.createEstatesGentleMelody(ctx, loopTime, loopDuration, masterGain);
              this.createEstatesHarmonyPads(ctx, loopTime, loopDuration, masterGain);
              this.createEstatesAmbientWash(ctx, loopTime, loopDuration, masterGain);
              this.createEstatesArpeggio(ctx, loopTime, loopDuration, masterGain);
              this.createEstatesAccents(ctx, loopTime, loopDuration, masterGain);
              loopEstates();
            }
          }, loopDuration * 1000);
        }
      };
      
      loopEstates();
      
    } catch (error) {
      console.error('Error playing estates music:', error);
      this.estatesPlaying = false;
    }
  }

  private createEstatesWarmBass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.3, startTime);
    bassGain.connect(masterGain);

    // Warm, Stardew Valley-style bass progression: C - Am - F - G
    const bassNotes = [130.81, 110, 87.307, 97.999]; // C3, A2, F2, G2
    const noteLength = 2.0; // 2 seconds per note for warmth

    for (let i = 0; i < duration; i += noteLength) {
      const noteIndex = Math.floor(i / noteLength) % bassNotes.length;
      const bass = ctx.createOscillator();
      const noteGain = ctx.createGain();
      
      bass.connect(noteGain);
      noteGain.connect(bassGain);
      
      bass.type = 'sine'; // Warm, not harsh
      bass.frequency.value = bassNotes[noteIndex];
      
      noteGain.gain.setValueAtTime(0.7, startTime + i);
      noteGain.gain.exponentialRampToValueAtTime(0.4, startTime + i + noteLength * 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + noteLength);
      
      bass.start(startTime + i);
      bass.stop(startTime + i + noteLength);
      this.estatesNodes.push(bass, noteGain);
    }
    
    this.estatesNodes.push(bassGain);
  }

  private createEstatesGentleMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.25, startTime);
    melodyGain.connect(masterGain);

    // Beautiful, flowing melody like Stardew Valley
    const melody = [
      { freq: 523.25, time: 0, length: 1.5 },   // C5
      { freq: 587.33, time: 1.5, length: 1 },   // D5
      { freq: 659.25, time: 2.5, length: 1.5 }, // E5
      { freq: 523.25, time: 4, length: 1 },     // C5
      { freq: 440, time: 5, length: 1 },        // A4
      { freq: 493.88, time: 6, length: 1 },     // B4
      { freq: 523.25, time: 7, length: 1 },     // C5
      { freq: 587.33, time: 8, length: 2 },     // D5 (long)
      { freq: 659.25, time: 10, length: 1 },    // E5
      { freq: 698.46, time: 11, length: 1 },    // F5
      { freq: 659.25, time: 12, length: 1.5 },  // E5
      { freq: 587.33, time: 13.5, length: 1 },  // D5
      { freq: 523.25, time: 14.5, length: 1.5 }, // C5
      { freq: 440, time: 16, length: 4 }        // A4 (very long)
    ];

    melody.forEach(note => {
      if (note.time < duration) {
        const noteTime = startTime + note.time;
        
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'triangle'; // Warm, gentle tone
        osc.frequency.value = note.freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1;
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.6, noteTime + 0.1);
        noteGain.gain.linearRampToValueAtTime(0.4, noteTime + note.length * 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + note.length);
        
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(melodyGain);
        
        osc.start(noteTime);
        osc.stop(noteTime + note.length);
        this.estatesNodes.push(osc, noteGain, filter);
      }
    });
    
    this.estatesNodes.push(melodyGain);
  }

  // Orchestral String Washes: Lush harmonic foundation
  private createEstatesHarmonyPads(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.25, startTime); // Increased for richer sound
    padGain.connect(masterGain);
    
    // Rich orchestral chord progressions - more sophisticated harmony
    const chordProgression = [
      // Extended chords for orchestral richness
      {chords: [261.63, 329.63, 392.00, 523.25], duration: 6.5, delay: 0},    // Cmaj7
      {chords: [220.00, 261.63, 329.63, 440.00], duration: 6.5, delay: 6.5},  // Am7
      {chords: [174.61, 220.00, 261.63, 349.23], duration: 6.5, delay: 13},   // Fmaj7
      {chords: [196.00, 246.94, 293.66, 392.00], duration: 6.5, delay: 19.5}, // G7
    ];
    
    for (const {chords, duration: chordDuration, delay} of chordProgression) {
      if (delay < duration) {
        chords.forEach((freq, voiceIndex) => {
          const pad = ctx.createOscillator();
          const padNoteGain = ctx.createGain();
          const padFilter = ctx.createBiquadFilter();
          const chordTime = startTime + delay;
          
          pad.connect(padFilter);
          padFilter.connect(padNoteGain);
          padNoteGain.connect(padGain);
          
          // Different waveforms for orchestral texture
          pad.type = voiceIndex < 2 ? 'triangle' : 'sine'; // Lower voices warmer
          pad.frequency.value = freq;
          
          // Enhanced filtering for orchestral strings
          padFilter.type = 'lowpass';
          padFilter.frequency.value = 1500 - (voiceIndex * 200); // Lower voices darker
          padFilter.Q.value = 0.7;
          
          // Staggered entrances for orchestral realism
          const voiceDelay = voiceIndex * 0.1;
          padNoteGain.gain.setValueAtTime(0, chordTime + voiceDelay);
          padNoteGain.gain.linearRampToValueAtTime(0.5, chordTime + voiceDelay + 1.5);
          padNoteGain.gain.setValueAtTime(0.5, chordTime + chordDuration - 1);
          padNoteGain.gain.linearRampToValueAtTime(0.01, chordTime + chordDuration);
          
          pad.start(chordTime + voiceDelay);
          pad.stop(chordTime + chordDuration);
          this.estatesNodes.push(pad, padNoteGain, padFilter);
        });
      }
    }
    
    this.estatesNodes.push(padGain);
  }

  // Ethereal Ambient Wash: Additional atmospheric layer
  private createEstatesAmbientWash(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const washGain = ctx.createGain();
    washGain.gain.setValueAtTime(0.2, startTime);
    washGain.connect(masterGain);

    // Ethereal high pad that adds shimmer and atmosphere
    const shimmerFreqs = [
      1046.5,  // C6 - high ethereal tones
      1174.66, // D6
      1318.51, // E6
      1396.91, // F6
      1567.98  // G6
    ];

    // Create slow, evolving wash texture
    for (let i = 0; i < duration; i += 4) { // Every 4 seconds, new wash texture
      const washTime = startTime + i;
      
      // Use 2-3 frequencies for each wash
      const numVoices = 2 + Math.floor(Math.random() * 2);
      
      for (let voice = 0; voice < numVoices; voice++) {
        const freq = shimmerFreqs[Math.floor(Math.random() * shimmerFreqs.length)];
        const voiceDelay = voice * 0.3; // Stagger voice entrances
        
        const wash = ctx.createOscillator();
        const washNoteGain = ctx.createGain();
        const washFilter = ctx.createBiquadFilter();
        
        wash.connect(washFilter);
        washFilter.connect(washNoteGain);
        washNoteGain.connect(washGain);
        
        wash.type = 'sine'; // Pure, ethereal tone
        wash.frequency.value = freq;
        
        // Soft low-pass filtering for dreaminess
        washFilter.type = 'lowpass';
        washFilter.frequency.value = 3000;
        washFilter.Q.value = 0.3;
        
        // Very slow, gentle fades
        const noteTime = washTime + voiceDelay;
        const noteDuration = Math.min(6 + Math.random() * 4, duration - i); // 6-10 second notes
        
        washNoteGain.gain.setValueAtTime(0, noteTime);
        washNoteGain.gain.linearRampToValueAtTime(0.4, noteTime + 2);
        washNoteGain.gain.setValueAtTime(0.4, noteTime + noteDuration - 2);
        washNoteGain.gain.linearRampToValueAtTime(0.01, noteTime + noteDuration);
        
        wash.start(noteTime);
        wash.stop(noteTime + noteDuration);
        this.estatesNodes.push(wash, washNoteGain, washFilter);
      }
    }
    
    this.estatesNodes.push(washGain);
  }

  private createEstatesArpeggio(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const arpeggioGain = ctx.createGain();
    arpeggioGain.gain.setValueAtTime(0.12, startTime);
    arpeggioGain.connect(masterGain);
    
    // Gentle arpeggiated pattern like fishing music
    const arpeggioNotes = [
      523.25, 659.25, 783.99, 880.00, // C5, E5, G5, A5
      783.99, 659.25, 523.25, 440.00, // G5, E5, C5, A4
      493.88, 659.25, 783.99, 880.00, // B4, E5, G5, A5
      783.99, 659.25, 493.88, 392.00  // G5, E5, B4, G4
    ];
    
    const noteLength = 0.4; // Quick, gentle notes
    const startDelay = 4; // Start after other instruments establish
    
    for (let i = 0; i < (duration - startDelay) / noteLength; i++) {
      const noteIndex = i % arpeggioNotes.length;
      const noteTime = startTime + startDelay + i * noteLength;
      
      const arp = ctx.createOscillator();
      const arpGain = ctx.createGain();
      const arpFilter = ctx.createBiquadFilter();
      
      arp.type = 'sine'; // Pure, crystalline
      arp.frequency.value = arpeggioNotes[noteIndex];
      
      arpFilter.type = 'highpass';
      arpFilter.frequency.value = 200;
      arpFilter.Q.value = 0.5;
      
      arpGain.gain.setValueAtTime(0.3, noteTime);
      arpGain.gain.exponentialRampToValueAtTime(0.01, noteTime + noteLength * 0.8);
      
      arp.connect(arpFilter);
      arpFilter.connect(arpGain);
      arpGain.connect(arpeggioGain);
      
      arp.start(noteTime);
      arp.stop(noteTime + noteLength);
      this.estatesNodes.push(arp, arpGain, arpFilter);
    }
    
    this.estatesNodes.push(arpeggioGain);
  }

  private createEstatesAccents(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const accentGain = ctx.createGain();
    accentGain.gain.setValueAtTime(0.1, startTime);
    accentGain.connect(masterGain);

    // Subtle bell-like accents for elegance
    const accents = [
      { time: 8, freq: 1046.5 },   // C6 - high, gentle
      { time: 16, freq: 1318.5 },  // E6
      { time: 24, freq: 1046.5 }   // C6
    ];

    accents.forEach(accent => {
      if (accent.time < duration) {
        const accentTime = startTime + accent.time;
        
        const bell = ctx.createOscillator();
        const bellGain = ctx.createGain();
        const bellFilter = ctx.createBiquadFilter();
        
        bell.type = 'sine';
        bell.frequency.value = accent.freq;
        
        bellFilter.type = 'bandpass';
        bellFilter.frequency.value = 2000;
        bellFilter.Q.value = 2;
        
        bellGain.gain.setValueAtTime(0, accentTime);
        bellGain.gain.linearRampToValueAtTime(0.4, accentTime + 0.1);
        bellGain.gain.exponentialRampToValueAtTime(0.01, accentTime + 2);
        
        bell.connect(bellFilter);
        bellFilter.connect(bellGain);
        bellGain.connect(accentGain);
        
        bell.start(accentTime);
        bell.stop(accentTime + 2);
        this.estatesNodes.push(bell, bellGain, bellFilter);
      }
    });
    
    this.estatesNodes.push(accentGain);
  }

  public stopEstatesMusic() {
    this.estatesNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Already stopped
      }
    });
    this.estatesNodes = [];
    this.estatesPlaying = false;
  }

  // Keep the old marketplace method names for backward compatibility
  public playMarketplaceMusic() { this.playEstatesMusic(); }
  public stopMarketplaceMusic() { this.stopEstatesMusic(); }

  /**
   * DANGER MUSIC - Dark FF6-style atmospheric theme for arrests/confrontations
   */
  private dangerNodes: AudioNode[] = [];
  private dangerPlaying = false;

  public playDangerMusic() {
    if (this.isMuted || this.dangerPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.dangerPlaying = true;
      this.dangerNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 28; // 28 seconds per loop
      
      // Master gain with ominous fade-in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, now + 4);
      masterGain.connect(ctx.destination);
      this.dangerNodes.push(masterGain);

      // Create dark atmospheric layers
      this.createDangerDroneBase(ctx, now, loopDuration, masterGain);
      this.createDangerTensionStrings(ctx, now, loopDuration, masterGain);
      this.createDangerOminousBells(ctx, now, loopDuration, masterGain);
      this.createDangerDissonantHarmony(ctx, now, loopDuration, masterGain);
      this.createDangerDarkMelody(ctx, now, loopDuration, masterGain);
      
      // Schedule loop
      setTimeout(() => {
        if (this.dangerPlaying) {
          this.stopDangerMusic();
          this.playDangerMusic();
        }
      }, loopDuration * 1000);
      
    } catch (error) {
      console.error('Error playing danger music:', error);
      this.dangerPlaying = false;
    }
  }

  private createDangerDroneBase(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.4, startTime);
    droneGain.connect(masterGain);

    // Deep, ominous drone on D and A (perfect 5th, but dark)
    const droneFreqs = [73.42, 110]; // D2, A2
    
    droneFreqs.forEach(freq => {
      const drone = ctx.createOscillator();
      const droneGainNode = ctx.createGain();
      const droneFilter = ctx.createBiquadFilter();
      
      drone.type = 'sawtooth';
      drone.frequency.value = freq;
      
      droneFilter.type = 'lowpass';
      droneFilter.frequency.value = 120;
      droneFilter.Q.value = 2;
      
      droneGainNode.gain.setValueAtTime(0, startTime);
      droneGainNode.gain.linearRampToValueAtTime(0.8, startTime + 3);
      droneGainNode.gain.setValueAtTime(0.8, startTime + duration - 3);
      droneGainNode.gain.linearRampToValueAtTime(0.01, startTime + duration);
      
      drone.connect(droneFilter);
      droneFilter.connect(droneGainNode);
      droneGainNode.connect(droneGain);
      
      drone.start(startTime);
      drone.stop(startTime + duration);
      this.dangerNodes.push(drone, droneGainNode, droneFilter);
    });
    
    this.dangerNodes.push(droneGain);
  }

  private createDangerTensionStrings(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const stringGain = ctx.createGain();
    stringGain.gain.setValueAtTime(0.2, startTime);
    stringGain.connect(masterGain);

    // Dissonant string clusters that create tension
    const clusters = [
      [293.66, 311.13, 329.63], // D4-Eb4-E4 (very dissonant)
      [349.23, 369.99, 392],     // F4-F#4-G4
      [220, 233.08, 246.94],     // A3-Bb3-B3
      [261.63, 277.18, 293.66]   // C4-C#4-D4
    ];

    clusters.forEach((cluster, clusterIndex) => {
      const clusterTime = startTime + clusterIndex * 7;
      
      cluster.forEach(freq => {
        const string = ctx.createOscillator();
        const stringGainNode = ctx.createGain();
        const stringFilter = ctx.createBiquadFilter();
        
        string.type = 'sawtooth';
        string.frequency.value = freq;
        
        stringFilter.type = 'bandpass';
        stringFilter.frequency.value = 600;
        stringFilter.Q.value = 3; // High Q for tension
        
        stringGainNode.gain.setValueAtTime(0, clusterTime);
        stringGainNode.gain.linearRampToValueAtTime(0.3, clusterTime + 1);
        stringGainNode.gain.setValueAtTime(0.3, clusterTime + 5);
        stringGainNode.gain.exponentialRampToValueAtTime(0.01, clusterTime + 7);
        
        string.connect(stringFilter);
        stringFilter.connect(stringGainNode);
        stringGainNode.connect(stringGain);
        
        string.start(clusterTime);
        string.stop(clusterTime + 7);
        this.dangerNodes.push(string, stringGainNode, stringFilter);
      });
    });
    
    this.dangerNodes.push(stringGain);
  }

  private createDangerOminousBells(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const bellGain = ctx.createGain();
    bellGain.gain.setValueAtTime(0.15, startTime);
    bellGain.connect(masterGain);

    // Sparse, ominous bell tolls at irregular intervals
    const bellTimes = [5, 12, 19, 25];
    const bellFreqs = [466.16, 415.30, 369.99, 440]; // Bb4, Ab4, F#4, A4
    
    bellTimes.forEach((time, index) => {
      if (time < duration) {
        const bellTime = startTime + time;
        
        const bell = ctx.createOscillator();
        const bellGainNode = ctx.createGain();
        const bellFilter = ctx.createBiquadFilter();
        
        bell.type = 'sine';
        bell.frequency.value = bellFreqs[index];
        
        bellFilter.type = 'bandpass';
        bellFilter.frequency.value = 800;
        bellFilter.Q.value = 2;
        
        bellGainNode.gain.setValueAtTime(0, bellTime);
        bellGainNode.gain.linearRampToValueAtTime(0.6, bellTime + 0.1);
        bellGainNode.gain.exponentialRampToValueAtTime(0.01, bellTime + 4);
        
        bell.connect(bellFilter);
        bellFilter.connect(bellGainNode);
        bellGainNode.connect(bellGain);
        
        bell.start(bellTime);
        bell.stop(bellTime + 4);
        this.dangerNodes.push(bell, bellGainNode, bellFilter);
      }
    });
    
    this.dangerNodes.push(bellGain);
  }

  private createDangerDissonantHarmony(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const harmonyGain = ctx.createGain();
    harmonyGain.gain.setValueAtTime(0.12, startTime);
    harmonyGain.connect(masterGain);

    // Minor 2nd and tritone intervals for maximum dissonance
    const dissonantPairs = [
      [146.83, 155.56], // D3-Eb3 (minor 2nd)
      [207.65, 293.66], // Ab3-D4 (tritone)
      [174.61, 184.997], // F3-F#3 (minor 2nd)
      [123.47, 174.61]   // B2-F3 (tritone)
    ];

    dissonantPairs.forEach((pair, pairIndex) => {
      const pairTime = startTime + pairIndex * 7;
      
      pair.forEach(freq => {
        const harm = ctx.createOscillator();
        const harmGain = ctx.createGain();
        const harmFilter = ctx.createBiquadFilter();
        
        harm.type = 'triangle';
        harm.frequency.value = freq;
        
        harmFilter.type = 'lowpass';
        harmFilter.frequency.value = 400;
        harmFilter.Q.value = 1.5;
        
        harmGain.gain.setValueAtTime(0, pairTime);
        harmGain.gain.linearRampToValueAtTime(0.3, pairTime + 2);
        harmGain.gain.setValueAtTime(0.3, pairTime + 5);
        harmGain.gain.exponentialRampToValueAtTime(0.01, pairTime + 7);
        
        harm.connect(harmFilter);
        harmFilter.connect(harmGain);
        harmGain.connect(harmonyGain);
        
        harm.start(pairTime);
        harm.stop(pairTime + 7);
        this.dangerNodes.push(harm, harmGain, harmFilter);
      });
    });
    
    this.dangerNodes.push(harmonyGain);
  }

  private createDangerDarkMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.25, startTime);
    melodyGain.connect(masterGain);

    // Dark, descending melody that suggests doom
    const darkMelody = [
      { freq: 587.33, time: 8, length: 2 },   // D5 (start high)
      { freq: 554.37, time: 10, length: 1 },  // Db5 (half-step down)
      { freq: 523.25, time: 11, length: 2 },  // C5
      { freq: 466.16, time: 13, length: 1.5 }, // Bb4
      { freq: 415.30, time: 14.5, length: 1.5 }, // Ab4
      { freq: 369.99, time: 16, length: 2 },  // F#4 (tritone, very dark)
      { freq: 329.63, time: 18, length: 3 },  // E4 (resolution, but still minor)
      
      // Echo the darkness
      { freq: 466.16, time: 22, length: 1 },  // Bb4 (echo)
      { freq: 415.30, time: 23, length: 1 },  // Ab4
      { freq: 369.99, time: 24, length: 2 },  // F#4
      { freq: 293.66, time: 26, length: 2 }   // D4 (final dark resolution)
    ];

    darkMelody.forEach(note => {
      if (note.time < duration) {
        const noteTime = startTime + note.time;
        
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.value = note.freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 2;
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.7, noteTime + 0.1);
        noteGain.gain.linearRampToValueAtTime(0.4, noteTime + note.length * 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + note.length);
        
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(melodyGain);
        
        osc.start(noteTime);
        osc.stop(noteTime + note.length);
        this.dangerNodes.push(osc, noteGain, filter);
      }
    });
    
    this.dangerNodes.push(melodyGain);
  }

  public stopDangerMusic() {
    this.dangerNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Already stopped
      }
    });
    this.dangerNodes = [];
    this.dangerPlaying = false;
  }

  /**
   * MODERN CITY MUSIC - Upbeat urban theme for modern settings
   */
  private modernCityNodes: AudioNode[] = [];
  private modernCityPlaying = false;

  public playModernCityMusic() {
    if (this.isMuted || this.modernCityPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.modernCityPlaying = true;
      this.modernCityNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 24; // 24 seconds per loop
      
      // Master gain with energetic fade-in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 1);
      masterGain.connect(ctx.destination);
      this.modernCityNodes.push(masterGain);

      // Create modern urban music layers
      this.createCityDrivingBass(ctx, now, loopDuration, masterGain);
      this.createCityPowerfulDrums(ctx, now, loopDuration, masterGain);
      this.createCityEpicMelody(ctx, now, loopDuration, masterGain);
      this.createCityHeroicBrass(ctx, now, loopDuration, masterGain);
      this.createCityEnergeticStrings(ctx, now, loopDuration, masterGain);
      
      // Schedule loop
      setTimeout(() => {
        if (this.modernCityPlaying) {
          this.stopModernCityMusic();
          this.playModernCityMusic();
        }
      }, loopDuration * 1000);
      
    } catch (error) {
      console.error('Error playing modern city music:', error);
      this.modernCityPlaying = false;
    }
  }

  private createCityDrivingBass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.4, startTime);
    bassGain.connect(masterGain);

    // Driving bass progression: Em - C - G - D (vi-IV-I-V in G major, very energetic)
    const bassNotes = [164.81, 130.81, 196, 146.83]; // E3, C3, G3, D3
    const noteLength = 1.0; // Fast 1-second changes for energy

    for (let i = 0; i < duration; i += noteLength) {
      const noteIndex = Math.floor(i / noteLength) % bassNotes.length;
      const bass = ctx.createOscillator();
      const noteGain = ctx.createGain();
      const bassFilter = ctx.createBiquadFilter();
      
      bass.connect(bassFilter);
      bassFilter.connect(noteGain);
      noteGain.connect(bassGain);
      
      bass.type = 'sawtooth';
      bass.frequency.value = bassNotes[noteIndex];
      
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 200;
      bassFilter.Q.value = 1;
      
      noteGain.gain.setValueAtTime(1.0, startTime + i);
      noteGain.gain.exponentialRampToValueAtTime(0.7, startTime + i + noteLength * 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + noteLength);
      
      bass.start(startTime + i);
      bass.stop(startTime + i + noteLength);
      this.modernCityNodes.push(bass, noteGain, bassFilter);
    }
    
    this.modernCityNodes.push(bassGain);
  }

  private createCityPowerfulDrums(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const drumGain = ctx.createGain();
    drumGain.gain.setValueAtTime(0.5, startTime);
    drumGain.connect(masterGain);
    
    const beatInterval = 0.25; // Very fast 240 BPM for intensity
    
    for (let i = 0; i < duration; i += beatInterval) {
      const beat = Math.floor(i / beatInterval) % 8;
      
      // Powerful kick pattern
      if (beat === 0 || beat === 2 || beat === 4 || beat === 6) {
        this.createCityKick(ctx, startTime + i, drumGain, beat === 0 || beat === 4);
      }
      
      // Snare on off-beats
      if (beat === 2 || beat === 6) {
        this.createCitySnare(ctx, startTime + i, drumGain);
      }
      
      // Hi-hat on every beat for drive
      this.createCityHiHat(ctx, startTime + i, drumGain);
    }
    
    this.modernCityNodes.push(drumGain);
  }

  private createCityKick(ctx: AudioContext, startTime: number, drumGain: GainNode, isAccent: boolean) {
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    const kickFilter = ctx.createBiquadFilter();
    
    kick.type = 'sine';
    kick.frequency.setValueAtTime(70, startTime);
    kick.frequency.exponentialRampToValueAtTime(30, startTime + 0.1);
    
    kickFilter.type = 'lowpass';
    kickFilter.frequency.value = 100;
    
    kickGain.gain.setValueAtTime(isAccent ? 1.4 : 1.0, startTime);
    kickGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
    
    kick.connect(kickFilter);
    kickFilter.connect(kickGain);
    kickGain.connect(drumGain);
    
    kick.start(startTime);
    kick.stop(startTime + 0.2);
    this.modernCityNodes.push(kick, kickGain, kickFilter);
  }

  private createCitySnare(ctx: AudioContext, startTime: number, drumGain: GainNode) {
    const snare = ctx.createOscillator();
    const snareGain = ctx.createGain();
    const snareFilter = ctx.createBiquadFilter();
    
    snare.type = 'square';
    snare.frequency.value = 220;
    
    snareFilter.type = 'highpass';
    snareFilter.frequency.value = 1200;
    
    snareGain.gain.setValueAtTime(0.9, startTime);
    snareGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
    
    snare.connect(snareFilter);
    snareFilter.connect(snareGain);
    snareGain.connect(drumGain);
    
    snare.start(startTime);
    snare.stop(startTime + 0.08);
    this.modernCityNodes.push(snare, snareGain, snareFilter);
  }

  private createCityHiHat(ctx: AudioContext, startTime: number, drumGain: GainNode) {
    const hihat = ctx.createOscillator();
    const hihatGain = ctx.createGain();
    const hihatFilter = ctx.createBiquadFilter();
    
    hihat.type = 'square';
    hihat.frequency.value = 10000;
    
    hihatFilter.type = 'highpass';
    hihatFilter.frequency.value = 8000;
    
    hihatGain.gain.setValueAtTime(0.15, startTime);
    hihatGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.03);
    
    hihat.connect(hihatFilter);
    hihatFilter.connect(hihatGain);
    hihatGain.connect(drumGain);
    
    hihat.start(startTime);
    hihat.stop(startTime + 0.03);
    this.modernCityNodes.push(hihat, hihatGain, hihatFilter);
  }

  private createCityEpicMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.35, startTime);
    melodyGain.connect(masterGain);

    // Incredibly catchy FF6-style combat melody - heroic and memorable
    const melody = [
      // Opening heroic phrase (measures 1-2)
      { freq: 783.99, time: 0, length: 0.5 },     // G5 (strong opening)
      { freq: 659.25, time: 0.5, length: 0.5 },   // E5
      { freq: 523.25, time: 1, length: 1 },       // C5 (longer)
      { freq: 587.33, time: 2, length: 0.5 },     // D5
      { freq: 659.25, time: 2.5, length: 0.5 },   // E5
      { freq: 783.99, time: 3, length: 1 },       // G5 (back to top)
      
      // Answering phrase (measures 3-4)
      { freq: 880, time: 4, length: 0.5 },        // A5 (even higher!)
      { freq: 783.99, time: 4.5, length: 0.5 },   // G5
      { freq: 659.25, time: 5, length: 1 },       // E5 (longer)
      { freq: 698.46, time: 6, length: 0.5 },     // F5
      { freq: 783.99, time: 6.5, length: 0.5 },   // G5
      { freq: 880, time: 7, length: 1 },          // A5 (resolution)
      
      // Development phrase (measures 5-6)
      { freq: 1046.5, time: 8, length: 0.5 },     // C6 (climax!)
      { freq: 880, time: 8.5, length: 0.5 },      // A5
      { freq: 783.99, time: 9, length: 0.5 },     // G5
      { freq: 659.25, time: 9.5, length: 0.5 },   // E5
      { freq: 587.33, time: 10, length: 1 },      // D5
      { freq: 523.25, time: 11, length: 1 },      // C5
      
      // Final heroic phrase (measures 7-8)
      { freq: 783.99, time: 12, length: 0.75 },   // G5 (return of opening)
      { freq: 880, time: 12.75, length: 0.25 },   // A5 (quick)
      { freq: 1046.5, time: 13, length: 1 },      // C6 (big finish)
      { freq: 880, time: 14, length: 0.5 },       // A5
      { freq: 783.99, time: 14.5, length: 0.5 },  // G5
      { freq: 659.25, time: 15, length: 1 }       // E5 (final resolution)
    ];

    melody.forEach(note => {
      if (note.time < duration) {
        const noteTime = startTime + note.time;
        
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'triangle';
        osc.frequency.value = note.freq;
        
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 2;
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(1.0, noteTime + 0.05);
        noteGain.gain.linearRampToValueAtTime(0.8, noteTime + note.length * 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + note.length);
        
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(melodyGain);
        
        osc.start(noteTime);
        osc.stop(noteTime + note.length);
        this.modernCityNodes.push(osc, noteGain, filter);
      }
    });
    
    this.modernCityNodes.push(melodyGain);
  }

  private createCityHeroicBrass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const brassGain = ctx.createGain();
    brassGain.gain.setValueAtTime(0.3, startTime);
    brassGain.connect(masterGain);

    // Powerful brass stabs on strong beats
    for (let i = 0; i < duration; i += 4) {
      const brassTime = startTime + i;
      
      // Epic brass chord: Em chord (E-G-B)
      const brassChord = [659.25, 783.99, 987.77]; // E5, G5, B5
      
      brassChord.forEach(freq => {
        const brass = ctx.createOscillator();
        const brassGainNode = ctx.createGain();
        const brassFilter = ctx.createBiquadFilter();
        
        brass.type = 'sawtooth';
        brass.frequency.value = freq;
        
        brassFilter.type = 'bandpass';
        brassFilter.frequency.value = 1400;
        brassFilter.Q.value = 3;
        
        brassGainNode.gain.setValueAtTime(0, brassTime);
        brassGainNode.gain.linearRampToValueAtTime(0.8, brassTime + 0.1);
        brassGainNode.gain.linearRampToValueAtTime(0.6, brassTime + 1.5);
        brassGainNode.gain.exponentialRampToValueAtTime(0.01, brassTime + 2);
        
        brass.connect(brassFilter);
        brassFilter.connect(brassGainNode);
        brassGainNode.connect(brassGain);
        
        brass.start(brassTime);
        brass.stop(brassTime + 2);
        this.modernCityNodes.push(brass, brassGainNode, brassFilter);
      });
    }
    
    this.modernCityNodes.push(brassGain);
  }

  private createCityEnergeticStrings(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const stringGain = ctx.createGain();
    stringGain.gain.setValueAtTime(0.25, startTime);
    stringGain.connect(masterGain);

    // Fast string arpeggios for energy
    const arpeggioPattern = [329.63, 392, 493.88, 659.25]; // E4-G4-B4-E5
    const noteLength = 0.125; // Very fast eighth notes
    
    for (let i = 0; i < duration; i += noteLength) {
      const noteIndex = Math.floor(i / noteLength) % arpeggioPattern.length;
      const noteTime = startTime + i;
      
      const string = ctx.createOscillator();
      const stringGainNode = ctx.createGain();
      const stringFilter = ctx.createBiquadFilter();
      
      string.type = 'sawtooth';
      string.frequency.value = arpeggioPattern[noteIndex];
      
      stringFilter.type = 'highpass';
      stringFilter.frequency.value = 300;
      stringFilter.Q.value = 1;
      
      stringGainNode.gain.setValueAtTime(0.4, noteTime);
      stringGainNode.gain.exponentialRampToValueAtTime(0.01, noteTime + noteLength * 0.8);
      
      string.connect(stringFilter);
      stringFilter.connect(stringGainNode);
      stringGainNode.connect(stringGain);
      
      string.start(noteTime);
      string.stop(noteTime + noteLength);
      this.modernCityNodes.push(string, stringGainNode, stringFilter);
    }
    
    this.modernCityNodes.push(stringGain);
  }

  public stopModernCityMusic() {
    this.modernCityNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Already stopped
      }
    });
    this.modernCityNodes = [];
    this.modernCityPlaying = false;
  }

  /**
   * TRUE FF6 COMBAT MUSIC - Intense, looping Bach-fugue style melodic fragments
   */
  private ff6CombatNodes: AudioNode[] = [];
  private ff6CombatPlaying = false;

  public playFF6CombatMusic() {
    if (this.isMuted || this.ff6CombatPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.ff6CombatPlaying = true;
      this.ff6CombatNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 30; // 30 seconds per loop
      
      // Master gain with slow fade-in at 50% volume for quiet battle music
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 3); // 3 second fade-in
      masterGain.connect(ctx.destination);
      this.ff6CombatNodes.push(masterGain);

      // Create proper FF6 battle theme: bass, drums, and ambient wash
      this.createFF6BattleBass(ctx, now, loopDuration, masterGain);
      this.createFF6BattleDrums(ctx, now, loopDuration, masterGain);
      this.createFF6AmbientWash(ctx, now, loopDuration, masterGain);
      
      // Schedule loop
      setTimeout(() => {
        if (this.ff6CombatPlaying) {
          this.stopFF6CombatMusic();
          this.playFF6CombatMusic();
        }
      }, loopDuration * 1000);
      
    } catch (error) {
      console.error('Error playing FF6 combat music:', error);
      this.ff6CombatPlaying = false;
    }
  }

  // FF6 Battle Bass: Ostinato pattern following i-bVII-bVI-V-i progression
  private createFF6BattleBass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.5, startTime);
    bassGain.connect(masterGain);

    // FF6 Bass progression: Am-G-F-E-Am (i-bVII-bVI-V-i)
    const bassChords = [
      110,    // A2 (i)
      98,     // G2 (bVII) 
      87.31,  // F2 (bVI)
      82.41,  // E2 (V)
      110     // A2 (i)
    ];
    
    const chordDuration = 6; // 6 seconds per chord in 30-second loop
    const beatLength = 0.5;  // 120 BPM driving ostinato

    for (let chordIndex = 0; chordIndex < bassChords.length; chordIndex++) {
      const chordStartTime = chordIndex * chordDuration;
      if (chordStartTime >= duration) break;
      
      const rootFreq = bassChords[chordIndex];
      const actualChordDuration = Math.min(chordDuration, duration - chordStartTime);
      
      // Create driving ostinato pattern within each chord
      for (let beat = 0; beat < actualChordDuration; beat += beatLength) {
        const bass = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const bassFilter = ctx.createBiquadFilter();
        
        bass.connect(bassFilter);
        bassFilter.connect(noteGain);
        noteGain.connect(bassGain);
        
        bass.type = 'sawtooth';
        bass.frequency.value = rootFreq;
        
        bassFilter.type = 'lowpass';
        bassFilter.frequency.value = 200;
        bassFilter.Q.value = 3;
        
        const noteTime = startTime + chordStartTime + beat;
        noteGain.gain.setValueAtTime(0.8, noteTime);
        noteGain.gain.exponentialRampToValueAtTime(0.1, noteTime + beatLength * 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + beatLength);
        
        bass.start(noteTime);
        bass.stop(noteTime + beatLength);
        this.ff6CombatNodes.push(bass, noteGain, bassFilter);
      }
    }
    
    this.ff6CombatNodes.push(bassGain);
  }

  // FF6 Battle Drums: Complex driving rhythm with fills and variations
  private createFF6BattleDrums(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const drumGain = ctx.createGain();
    drumGain.gain.setValueAtTime(0.4, startTime); // Reduced from 0.7
    drumGain.connect(masterGain);
    
    const sixteenthNote = 0.125; // 16th notes at 120 BPM
    const beatInterval = 0.5; // Quarter notes
    
    for (let i = 0; i < duration; i += sixteenthNote) {
      const sixteenthPosition = Math.floor(i / sixteenthNote) % 16; // 16 sixteenth notes per measure
      const beat = Math.floor(sixteenthPosition / 4); // Which quarter note (0-3)
      const subBeat = sixteenthPosition % 4; // Which sixteenth within the beat (0-3)
      const measure = Math.floor(i / (beatInterval * 4));
      const measureInLoop = measure % 8; // 8-measure pattern
      
      // KICK PATTERN - More complex with syncopation
      if (sixteenthPosition === 0 || // Beat 1
          sixteenthPosition === 6 || // Syncopated kick
          sixteenthPosition === 8 || // Beat 3
          (sixteenthPosition === 14 && measureInLoop % 2 === 1)) { // Occasional syncopation
        this.createFF6Kick(ctx, startTime + i, drumGain);
      }
      
      // SNARE PATTERN - Backbeat with ghost notes
      if (sixteenthPosition === 4 || sixteenthPosition === 12) { // Beats 2 and 4 (main snare)
        this.createFF6Snare(ctx, startTime + i, drumGain);
      } else if (sixteenthPosition === 2 || sixteenthPosition === 10) { // Ghost notes
        this.createFF6GhostSnare(ctx, startTime + i, drumGain);
      }
      
      // HI-HAT PATTERN - Steady 8th notes with accents (very quiet)
      if (subBeat === 0 || subBeat === 2) { // 8th note hi-hats
        if (beat === 1 || beat === 3) { // Accent on backbeat
          this.createFF6HiHat(ctx, startTime + i, drumGain, 0.06); // Further reduced
        } else {
          this.createFF6HiHat(ctx, startTime + i, drumGain, 0.03); // Very quiet
        }
      }
      
      // CRASH CYMBALS - Strategic placement
      if (sixteenthPosition === 0 && measure % 8 === 0) {
        this.createFF6Crash(ctx, startTime + i, drumGain);
      }
      
      // DRUM FILLS - Every 4th measure
      if (measureInLoop === 3 && sixteenthPosition >= 12) { // Last beat of 4th measure
        this.createFF6TomFill(ctx, startTime + i, drumGain, sixteenthPosition - 12);
      }
    }
    
    this.ff6CombatNodes.push(drumGain);
  }

  private createFF6Kick(ctx: AudioContext, startTime: number, drumGain: GainNode) {
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    
    kick.type = 'sine';
    kick.frequency.setValueAtTime(60, startTime);
    kick.frequency.exponentialRampToValueAtTime(25, startTime + 0.08);
    
    kickGain.gain.setValueAtTime(1.2, startTime);
    kickGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
    
    kick.connect(kickGain);
    kickGain.connect(drumGain);
    
    kick.start(startTime);
    kick.stop(startTime + 0.15);
    this.ff6CombatNodes.push(kick, kickGain);
  }

  private createFF6Snare(ctx: AudioContext, startTime: number, drumGain: GainNode) {
    const snare = ctx.createOscillator();
    const snareGain = ctx.createGain();
    const snareFilter = ctx.createBiquadFilter();
    
    snare.type = 'square';
    snare.frequency.value = 200;
    
    snareFilter.type = 'bandpass';
    snareFilter.frequency.value = 1200;
    snareFilter.Q.value = 2;
    
    snareGain.gain.setValueAtTime(0.9, startTime);
    snareGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
    
    snare.connect(snareFilter);
    snareFilter.connect(snareGain);
    snareGain.connect(drumGain);
    
    snare.start(startTime);
    snare.stop(startTime + 0.1);
    this.ff6CombatNodes.push(snare, snareGain, snareFilter);
  }
  
  private createFF6Crash(ctx: AudioContext, startTime: number, drumGain: GainNode) {
    const crash = ctx.createOscillator();
    const crashGain = ctx.createGain();
    const crashFilter = ctx.createBiquadFilter();
    
    crash.type = 'square';
    crash.frequency.value = 3000;
    
    crashFilter.type = 'highpass';
    crashFilter.frequency.value = 2000;
    crashFilter.Q.value = 0.5;
    
    crashGain.gain.setValueAtTime(0.15, startTime); // Much quieter crash
    crashGain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5);
    
    crash.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(drumGain);
    
    crash.start(startTime);
    crash.stop(startTime + 1.5);
    this.ff6CombatNodes.push(crash, crashGain, crashFilter);
  }
  
  private createFF6Ride(ctx: AudioContext, startTime: number, drumGain: GainNode) {
    const ride = ctx.createOscillator();
    const rideGain = ctx.createGain();
    const rideFilter = ctx.createBiquadFilter();
    
    ride.type = 'triangle';
    ride.frequency.value = 2400;
    
    rideFilter.type = 'bandpass';
    rideFilter.frequency.value = 2000;
    rideFilter.Q.value = 1;
    
    rideGain.gain.setValueAtTime(0.15, startTime);
    rideGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
    
    ride.connect(rideFilter);
    rideFilter.connect(rideGain);
    rideGain.connect(drumGain);
    
    ride.start(startTime);
    ride.stop(startTime + 0.3);
    this.ff6CombatNodes.push(ride, rideGain, rideFilter);
  }
  
  private createFF6GhostSnare(ctx: AudioContext, startTime: number, drumGain: GainNode) {
    const snare = ctx.createOscillator();
    const snareGain = ctx.createGain();
    const snareFilter = ctx.createBiquadFilter();
    
    snare.type = 'square';
    snare.frequency.value = 200;
    
    snareFilter.type = 'bandpass';
    snareFilter.frequency.value = 1200;
    snareFilter.Q.value = 2;
    
    snareGain.gain.setValueAtTime(0.2, startTime); // Much quieter than main snare
    snareGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
    
    snare.connect(snareFilter);
    snareFilter.connect(snareGain);
    snareGain.connect(drumGain);
    
    snare.start(startTime);
    snare.stop(startTime + 0.05);
    this.ff6CombatNodes.push(snare, snareGain, snareFilter);
  }
  
  private createFF6HiHat(ctx: AudioContext, startTime: number, drumGain: GainNode, volume: number = 0.25) {
    const hihat = ctx.createOscillator();
    const hihatGain = ctx.createGain();
    const hihatFilter = ctx.createBiquadFilter();
    
    hihat.type = 'square';
    hihat.frequency.value = 4000;
    
    hihatFilter.type = 'highpass';
    hihatFilter.frequency.value = 3000;
    hihatFilter.Q.value = 1;
    
    hihatGain.gain.setValueAtTime(volume, startTime);
    hihatGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
    
    hihat.connect(hihatFilter);
    hihatFilter.connect(hihatGain);
    hihatGain.connect(drumGain);
    
    hihat.start(startTime);
    hihat.stop(startTime + 0.1);
    this.ff6CombatNodes.push(hihat, hihatGain, hihatFilter);
  }
  
  private createFF6TomFill(ctx: AudioContext, startTime: number, drumGain: GainNode, fillPosition: number) {
    const tomFreqs = [120, 100, 80, 60]; // High, mid, low, floor tom
    const tomFreq = tomFreqs[fillPosition] || 100;
    
    const tom = ctx.createOscillator();
    const tomGain = ctx.createGain();
    const tomFilter = ctx.createBiquadFilter();
    
    tom.type = 'sine';
    tom.frequency.setValueAtTime(tomFreq, startTime);
    tom.frequency.exponentialRampToValueAtTime(tomFreq * 0.5, startTime + 0.1);
    
    tomFilter.type = 'bandpass';
    tomFilter.frequency.value = tomFreq * 3;
    tomFilter.Q.value = 2;
    
    tomGain.gain.setValueAtTime(0.6, startTime);
    tomGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
    
    tom.connect(tomFilter);
    tomFilter.connect(tomGain);
    tomGain.connect(drumGain);
    
    tom.start(startTime);
    tom.stop(startTime + 0.2);
    this.ff6CombatNodes.push(tom, tomGain, tomFilter);
  }

  // FF6 Ambient Wash: Harmonic pad that follows and accents the bass progression
  private createFF6AmbientWash(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const washGain = ctx.createGain();
    washGain.gain.setValueAtTime(0.3, startTime); // Increased volume
    washGain.connect(masterGain);

    // Ambient wash following the bass progression: Am-G-F-E-Am
    const washChords = [
      [220, 262, 330],    // Am chord (A3-C4-E4)
      [196, 247, 294],    // G chord (G3-B3-D4) 
      [175, 220, 262],    // F chord (F3-A3-C4)
      [165, 208, 247],    // E chord (E3-G#3-B3)
      [220, 262, 330]     // Am chord (A3-C4-E4)
    ];
    
    const chordDuration = 6; // 6 seconds per chord, matching bass
    
    washChords.forEach((chord, chordIndex) => {
      const chordStartTime = chordIndex * chordDuration;
      if (chordStartTime >= duration) return;
      
      const actualDuration = Math.min(chordDuration, duration - chordStartTime);
      
      chord.forEach(freq => {
        const wash = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const washFilter = ctx.createBiquadFilter();
        
        wash.connect(washFilter);
        washFilter.connect(noteGain);
        noteGain.connect(washGain);
        
        wash.type = 'triangle'; // Smooth, warm tone
        wash.frequency.value = freq;
        
        // Low-pass filter for ambient smoothness
        washFilter.type = 'lowpass';
        washFilter.frequency.value = 800;
        washFilter.Q.value = 0.5;
        
        const noteTime = startTime + chordStartTime;
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.3, noteTime + 1); // Slow fade in
        noteGain.gain.setValueAtTime(0.3, noteTime + actualDuration - 1);
        noteGain.gain.linearRampToValueAtTime(0.01, noteTime + actualDuration); // Slow fade out
        
        wash.start(noteTime);
        wash.stop(noteTime + actualDuration);
        this.ff6CombatNodes.push(wash, noteGain, washFilter);
      });
    });
    
    this.ff6CombatNodes.push(washGain);
  }

  // FF6 Power Chords: i-bVII-bVI-V-i progression (Am-G-F-E-Am)
  private createFF6BattlePowerChords(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.4, startTime);
    chordGain.connect(masterGain);

    // FF6 power chord progression in A minor
    const powerChords = [
      [220, 330],     // Am power chord (A3-E4)
      [196, 293.66],  // G power chord (G3-D4) 
      [174.61, 261.63], // F power chord (F3-C4)
      [164.81, 246.94], // E power chord (E3-B3)
      [220, 330]      // Am power chord (A3-E4)
    ];
    
    const chordDuration = 6; // 6 seconds per chord
    const attackLength = 0.25; // Sharp attack

    powerChords.forEach((chord, chordIndex) => {
      const chordTime = startTime + chordIndex * chordDuration;
      if (chordTime >= duration) return;
      
      // Create multiple attacks per chord for driving feel
      for (let attack = 0; attack < 12; attack++) { // 12 attacks per 6-second chord
        const attackTime = chordTime + attack * 0.5;
        if (attackTime >= startTime + duration) break;
        
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          
          osc.connect(filter);
          filter.connect(oscGain);
          oscGain.connect(chordGain);
          
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          
          filter.type = 'bandpass';
          filter.frequency.value = 800;
          filter.Q.value = 2;
          
          oscGain.gain.setValueAtTime(0.6, attackTime);
          oscGain.gain.exponentialRampToValueAtTime(0.2, attackTime + attackLength * 0.7);
          oscGain.gain.exponentialRampToValueAtTime(0.01, attackTime + attackLength);
          
          osc.start(attackTime);
          osc.stop(attackTime + attackLength);
          this.ff6CombatNodes.push(osc, oscGain, filter);
        });
      }
    });
    
    this.ff6CombatNodes.push(chordGain);
  }

  // FF6 Battle Riff: Muscular riff-based writing around 1-♭7-♭6-5 (A-G-F-E)
  private createFF6BattleRiff(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const riffGain = ctx.createGain();
    riffGain.gain.setValueAtTime(0.45, startTime);
    riffGain.connect(masterGain);

    // Muscular riff motifs around A-G-F-E (scale degrees 1-♭7-♭6-5)
    const riffPattern = [
      // Main motif: descending Aeolian cell (A-G-F-E)
      { freq: 440, time: 0, length: 0.25 },      // A4
      { freq: 392, time: 0.25, length: 0.25 },   // G4
      { freq: 349.23, time: 0.5, length: 0.25 }, // F4
      { freq: 329.63, time: 0.75, length: 0.25 }, // E4
      
      // Sequence up by step (B-A-G-F#)
      { freq: 493.88, time: 1, length: 0.25 },   // B4
      { freq: 440, time: 1.25, length: 0.25 },   // A4
      { freq: 392, time: 1.5, length: 0.25 },    // G4
      { freq: 369.99, time: 1.75, length: 0.25 }, // F#4
      
      // Octave doubling (A5-G5-F5-E5)
      { freq: 880, time: 2, length: 0.25 },      // A5
      { freq: 783.99, time: 2.25, length: 0.25 }, // G5
      { freq: 698.46, time: 2.5, length: 0.25 },  // F5
      { freq: 659.25, time: 2.75, length: 0.25 }, // E5
      
      // Resolution back to tonic
      { freq: 440, time: 3, length: 0.5 }        // A4 (sustained)
    ];
    
    const motifDuration = 3.5; // 3.5 seconds per motif
    const motifsPerLoop = Math.floor(duration / motifDuration);
    
    for (let motifIndex = 0; motifIndex < motifsPerLoop; motifIndex++) {
      const motifStartTime = motifIndex * motifDuration;
      
      riffPattern.forEach(note => {
        const noteTime = startTime + motifStartTime + note.time;
        if (noteTime >= startTime + duration) return;
        
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(riffGain);
        
        osc.type = 'square';
        osc.frequency.value = note.freq;
        
        filter.type = 'bandpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1.5;
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.8, noteTime + 0.01);
        noteGain.gain.linearRampToValueAtTime(0.6, noteTime + note.length * 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + note.length);
        
        osc.start(noteTime);
        osc.stop(noteTime + note.length);
        this.ff6CombatNodes.push(osc, noteGain, filter);
      });
    }
    
    this.ff6CombatNodes.push(riffGain);
  }

  // FF6 Harmonic Support: Melody doubles in thirds/sixths
  private createFF6BattleHarmony(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const harmonyGain = ctx.createGain();
    harmonyGain.gain.setValueAtTime(0.25, startTime);
    harmonyGain.connect(masterGain);

    // Harmony lines doubling the riff in thirds and sixths
    const harmonyPattern = [
      // Thirds above main riff (A-G-F-E becomes C-B-A-G)
      { freq: 523.25, time: 0, length: 0.25 },   // C5 (third above A)
      { freq: 493.88, time: 0.25, length: 0.25 }, // B4 (third above G)
      { freq: 440, time: 0.5, length: 0.25 },    // A4 (third above F)
      { freq: 392, time: 0.75, length: 0.25 },   // G4 (third above E)
      
      // Sixths above (A-G-F-E becomes F-E-D-C)
      { freq: 698.46, time: 1, length: 0.25 },   // F5 (sixth above A)
      { freq: 659.25, time: 1.25, length: 0.25 }, // E5 (sixth above G) 
      { freq: 587.33, time: 1.5, length: 0.25 },  // D5 (sixth above F)
      { freq: 523.25, time: 1.75, length: 0.25 }, // C5 (sixth above E)
      
      // Higher octave doubling
      { freq: 1046.5, time: 2, length: 0.25 },   // C6
      { freq: 987.77, time: 2.25, length: 0.25 }, // B5
      { freq: 880, time: 2.5, length: 0.25 },    // A5
      { freq: 783.99, time: 2.75, length: 0.25 }, // G5
      
      // Resolution harmony
      { freq: 523.25, time: 3, length: 0.5 }     // C5 (sustained)
    ];
    
    const motifDuration = 3.5;
    const motifsPerLoop = Math.floor(duration / motifDuration);
    
    for (let motifIndex = 0; motifIndex < motifsPerLoop; motifIndex++) {
      const motifStartTime = motifIndex * motifDuration;
      
      harmonyPattern.forEach(note => {
        const noteTime = startTime + motifStartTime + note.time;
        if (noteTime >= startTime + duration) return;
        
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(harmonyGain);
        
        osc.type = 'triangle';
        osc.frequency.value = note.freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.4, noteTime + 0.02);
        noteGain.gain.linearRampToValueAtTime(0.3, noteTime + note.length * 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + note.length);
        
        osc.start(noteTime);
        osc.stop(noteTime + note.length);
        this.ff6CombatNodes.push(osc, noteGain, filter);
      });
    }
    
    this.ff6CombatNodes.push(harmonyGain);
  }

  public stopFF6CombatMusic() {
    this.ff6CombatNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Already stopped
      }
    });
    this.ff6CombatNodes = [];
    this.ff6CombatPlaying = false;
  }

  /**
   * TEMPLE/SACRED MUSIC - Reverent, mystical, ethereal
   */
  private templeNodes: AudioNode[] = [];
  private templePlaying = false;

  public playTempleMusic() {
    if (this.isMuted || this.templePlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.templePlaying = true;
      this.templeNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 45; // 45 seconds per loop
      
      // Master gain - soft for reverence
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08 * this.masterVolume, now);
      masterGain.connect(ctx.destination);
      this.templeNodes.push(masterGain);

      // 1. Deep drone (continuous om-like sound)
      const createDrone = () => {
        const droneGain = ctx.createGain();
        droneGain.gain.value = 0.3;
        droneGain.connect(masterGain);
        
        // Multiple oscillators for rich drone
        [55, 82.5, 110, 165].forEach(freq => { // A1, E2, A2, E3
          const drone = ctx.createOscillator();
          const droneGain2 = ctx.createGain();
          const droneFilter = ctx.createBiquadFilter();
          
          drone.type = 'sine';
          drone.frequency.value = freq;
          
          droneFilter.type = 'lowpass';
          droneFilter.frequency.value = 200;
          droneFilter.Q.value = 5;
          
          droneGain2.gain.setValueAtTime(0, now);
          droneGain2.gain.linearRampToValueAtTime(0.1, now + 3);
          droneGain2.gain.setValueAtTime(0.1, now + loopDuration - 3);
          droneGain2.gain.linearRampToValueAtTime(0, now + loopDuration);
          
          drone.connect(droneFilter);
          droneFilter.connect(droneGain2);
          droneGain2.connect(droneGain);
          
          drone.start(now);
          drone.stop(now + loopDuration);
          this.templeNodes.push(drone);
        });
      };
      
      // 2. Tibetan bowl strikes
      const createBowls = () => {
        const bowlGain = ctx.createGain();
        bowlGain.gain.value = 0.25;
        bowlGain.connect(masterGain);
        
        // Bowl strikes at sacred intervals
        const strikeTimes = [0, 9, 18, 27, 36];
        
        strikeTimes.forEach(strikeTime => {
          const strike = now + strikeTime;
          
          // Multiple harmonics for bowl sound
          [220, 440, 660, 880, 1320].forEach((freq, index) => {
            const bowl = ctx.createOscillator();
            const bowlGain2 = ctx.createGain();
            const bowlFilter = ctx.createBiquadFilter();
            
            bowl.type = 'sine';
            bowl.frequency.value = freq;
            
            bowlFilter.type = 'bandpass';
            bowlFilter.frequency.value = freq;
            bowlFilter.Q.value = 50;
            
            // Longer decay for higher harmonics
            const decay = 5 + index * 2;
            bowlGain2.gain.setValueAtTime(0.2 / (index + 1), strike);
            bowlGain2.gain.exponentialRampToValueAtTime(0.001, strike + decay);
            
            bowl.connect(bowlFilter);
            bowlFilter.connect(bowlGain2);
            bowlGain2.connect(bowlGain);
            
            bowl.start(strike);
            bowl.stop(strike + decay);
            this.templeNodes.push(bowl);
          });
        });
      };
      
      // 3. Gregorian chant-like voices
      const createChant = () => {
        const chantGain = ctx.createGain();
        chantGain.gain.value = 0.15;
        chantGain.connect(masterGain);
        
        // Simple pentatonic phrases
        const phrases = [
          [220, 247, 294, 330, 294, 247, 220], // A3 B3 D4 E4 D4 B3 A3
          [294, 330, 392, 440, 392, 330, 294], // D4 E4 G4 A4 G4 E4 D4
        ];
        
        phrases.forEach((phrase, phraseIndex) => {
          const phraseStart = now + phraseIndex * 20;
          
          phrase.forEach((note, noteIndex) => {
            const noteTime = phraseStart + noteIndex * 2;
            
            // Multiple oscillators for voice-like timbre
            ['sine', 'triangle'].forEach(waveform => {
              const voice = ctx.createOscillator();
              const voiceGain = ctx.createGain();
              const voiceFilter = ctx.createBiquadFilter();
              
              voice.type = waveform as OscillatorType;
              voice.frequency.value = note;
              
              voiceFilter.type = 'lowpass';
              voiceFilter.frequency.value = 800;
              voiceFilter.Q.value = 2;
              
              const gainValue = waveform === 'sine' ? 0.1 : 0.05;
              voiceGain.gain.setValueAtTime(0, noteTime);
              voiceGain.gain.linearRampToValueAtTime(gainValue, noteTime + 0.3);
              voiceGain.gain.setValueAtTime(gainValue, noteTime + 1.5);
              voiceGain.gain.linearRampToValueAtTime(0, noteTime + 2);
              
              voice.connect(voiceFilter);
              voiceFilter.connect(voiceGain);
              voiceGain.connect(chantGain);
              
              voice.start(noteTime);
              voice.stop(noteTime + 2);
              this.templeNodes.push(voice);
            });
          });
        });
      };
      
      // 4. Wind chimes (occasional)
      const createWindChimes = () => {
        const chimeGain = ctx.createGain();
        chimeGain.gain.value = 0.06;
        chimeGain.connect(masterGain);
        
        // Random gentle chimes
        for (let i = 0; i < 20; i++) {
          const chimeTime = now + Math.random() * loopDuration;
          
          // Pentatonic scale for harmonious chimes
          const pentatonic = [523, 587, 659, 784, 880, 1047]; // C5 D5 E5 G5 A5 C6
          
          for (let j = 0; j < 3; j++) {
            const chime = ctx.createOscillator();
            const chimeGain2 = ctx.createGain();
            const chimeFilter = ctx.createBiquadFilter();
            
            chime.type = 'sine';
            chime.frequency.value = pentatonic[Math.floor(Math.random() * pentatonic.length)];
            
            chimeFilter.type = 'highpass';
            chimeFilter.frequency.value = 500;
            chimeFilter.Q.value = 1;
            
            chimeGain2.gain.setValueAtTime(0.04, chimeTime + j * 0.1);
            chimeGain2.gain.exponentialRampToValueAtTime(0.001, chimeTime + j * 0.1 + 2);
            
            chime.connect(chimeFilter);
            chimeFilter.connect(chimeGain2);
            chimeGain2.connect(chimeGain);
            
            chime.start(chimeTime + j * 0.1);
            chime.stop(chimeTime + j * 0.1 + 2);
            this.templeNodes.push(chime);
          }
        }
      };
      
      // Create all layers
      createDrone();
      createBowls();
      createChant();
      createWindChimes();
      
      // Schedule loop
      setTimeout(() => {
        if (this.templePlaying) {
          this.stopTempleMusic();
          this.playTempleMusic();
        }
      }, loopDuration * 1000);
      
    } catch (error) {
      console.error('Error playing temple music:', error);
      this.templePlaying = false;
    }
  }

  public stopTempleMusic() {
    this.templeNodes.forEach(node => {
      try {
        if (node.stop) {
          node.stop();
        }
      } catch (e) {
        // Already stopped
      }
    });
    this.templeNodes = [];
    this.templePlaying = false;
  }

  /**
   * FIRE SPREAD SOUND - Fire spreading effect
   */
  public playFireSpreadSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Crackling fire sound using noise
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() - 0.5) * Math.random(); // Varying intensity
      }
      
      const noise = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      noise.buffer = buffer;
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 0.5;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.1);
      gain.gain.setValueAtTime(0.3 * this.masterVolume, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      noise.start(now);
      noise.stop(now + 0.5);
      
    } catch (error) {
      console.error('Error playing fire spread sound:', error);
    }
  }

  /**
   * STEP SOUND - Single footstep
   */
  public playStepSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Quick step sound
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate;
        const envelope = Math.exp(-t * 20);
        data[i] = (Math.random() - 0.5) * envelope * 0.5;
      }
      
      const step = ctx.createBufferSource();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      step.buffer = buffer;
      step.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      
      gain.gain.setValueAtTime(0.4 * this.masterVolume, now);
      
      step.start(now);
      step.stop(now + 0.1);
      
    } catch (error) {
      console.error('Error playing step sound:', error);
    }
  }

  /**
   * TEST SOUNDS - Zelda-style treasure opening harp (improved)
   */
  public playTreasureOpeningSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // More sophisticated Zelda-style progression with suspended chords
      const notes = [
        // Opening flourish (mysterious)
        { freq: 392.00, delay: 0, volume: 0.15, duration: 2.5 },      // G4
        { freq: 493.88, delay: 0.05, volume: 0.12, duration: 2.4 },   // B4
        { freq: 587.33, delay: 0.1, volume: 0.1, duration: 2.3 },     // D5
        
        // Main arpeggio (ascending, magical)
        { freq: 523.25, delay: 0.4, volume: 0.18, duration: 2.0 },    // C5
        { freq: 659.25, delay: 0.5, volume: 0.16, duration: 1.9 },    // E5
        { freq: 783.99, delay: 0.6, volume: 0.14, duration: 1.8 },    // G5
        { freq: 987.77, delay: 0.7, volume: 0.12, duration: 1.7 },    // B5
        
        // Resolution (ethereal high notes)
        { freq: 1046.50, delay: 0.9, volume: 0.15, duration: 1.8 },   // C6
        { freq: 1318.51, delay: 1.0, volume: 0.12, duration: 1.7 },   // E6
        { freq: 1567.98, delay: 1.1, volume: 0.1, duration: 1.6 },    // G6
        
        // Final magical flourish
        { freq: 2093.00, delay: 1.3, volume: 0.08, duration: 1.5 },   // C7
        { freq: 1567.98, delay: 1.4, volume: 0.06, duration: 1.4 },   // G6
        { freq: 2093.00, delay: 1.5, volume: 0.05, duration: 1.3 },   // C7
      ];
      
      notes.forEach(({ freq, delay, volume, duration }) => {
        // Main harp tone with more complex timbre
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc2.frequency.value = freq * 1.01; // Slight detune for richness
        osc.type = 'sine';
        osc2.type = 'triangle';
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 6, now + delay);
        filter.frequency.exponentialRampToValueAtTime(freq * 2, now + delay + duration);
        filter.Q.value = 3;
        
        const startTime = now + delay;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume * this.masterVolume, startTime + 0.08);
        gain.gain.setValueAtTime(volume * this.masterVolume * 0.8, startTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
        osc2.start(startTime);
        osc2.stop(startTime + duration);
        
        // Octave harmonics for bell-like quality
        const harmonic = ctx.createOscillator();
        const harmonicGain = ctx.createGain();
        
        harmonic.connect(harmonicGain);
        harmonicGain.connect(ctx.destination);
        
        harmonic.frequency.value = freq * 2;
        harmonic.type = 'sine';
        
        harmonicGain.gain.setValueAtTime(0, startTime);
        harmonicGain.gain.linearRampToValueAtTime(volume * 0.3 * this.masterVolume, startTime + 0.1);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);
        
        harmonic.start(startTime);
        harmonic.stop(startTime + duration * 0.7);
      });
      
      // Subtle magical shimmer throughout
      const shimmerBuffer = ctx.createBuffer(1, ctx.sampleRate * 3.5, ctx.sampleRate);
      const shimmerData = shimmerBuffer.getChannelData(0);
      
      for (let i = 0; i < shimmerData.length; i++) {
        const t = i / ctx.sampleRate;
        // Multiple shimmer waves
        const envelope = Math.sin(t * Math.PI / 3.5) * (1 - t / 3.5);
        const shimmer = Math.sin(t * 2 * Math.PI * 6000) * Math.sin(t * 2 * Math.PI * 3);
        shimmerData[i] = shimmer * envelope * 0.02;
      }
      
      const shimmerSource = ctx.createBufferSource();
      const shimmerGain = ctx.createGain();
      const shimmerFilter = ctx.createBiquadFilter();
      
      shimmerSource.buffer = shimmerBuffer;
      shimmerSource.connect(shimmerFilter);
      shimmerFilter.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      
      shimmerFilter.type = 'highpass';
      shimmerFilter.frequency.value = 5000;
      shimmerFilter.Q.value = 0.5;
      
      shimmerGain.gain.setValueAtTime(0.15 * this.masterVolume, now);
      
      shimmerSource.start(now);
      shimmerSource.stop(now + 3.5);
      
    } catch (error) {
      console.error('Error playing treasure opening sound:', error);
    }
  }

  /**
   * TEST SOUNDS - Final Fantasy-style victory/item fanfare
   */
  public playFinalFantasySound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Classic FF victory fanfare-style progression
      const melody = [
        // First phrase
        { freq: 523.25, start: 0, dur: 0.15 },      // C5
        { freq: 523.25, start: 0.15, dur: 0.15 },   // C5
        { freq: 523.25, start: 0.3, dur: 0.15 },    // C5
        { freq: 523.25, start: 0.45, dur: 0.3 },    // C5 (longer)
        { freq: 415.30, start: 0.75, dur: 0.3 },    // G#4
        { freq: 466.16, start: 1.05, dur: 0.3 },    // A#4
        { freq: 523.25, start: 1.35, dur: 0.6 },    // C5 (held)
        
        // Second phrase (resolution)
        { freq: 466.16, start: 2.0, dur: 0.15 },    // A#4
        { freq: 523.25, start: 2.15, dur: 0.45 },   // C5
      ];
      
      // Bass line
      const bass = [
        { freq: 130.81, start: 0, dur: 0.45 },      // C3
        { freq: 130.81, start: 0.45, dur: 0.3 },    // C3
        { freq: 103.83, start: 0.75, dur: 0.3 },    // G#2
        { freq: 116.54, start: 1.05, dur: 0.3 },    // A#2
        { freq: 130.81, start: 1.35, dur: 0.65 },   // C3
        { freq: 87.31, start: 2.0, dur: 0.6 },      // F2
      ];
      
      // Create melody
      melody.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'square';
        
        // Soften the square wave
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        filter.Q.value = 1;
        
        const startTime = now + start;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, startTime + 0.01);
        gain.gain.setValueAtTime(0.15 * this.masterVolume, startTime + dur - 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        
        osc.start(startTime);
        osc.stop(startTime + dur);
      });
      
      // Create bass
      bass.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'triangle';
        
        const startTime = now + start;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, startTime + 0.02);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, startTime + dur - 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
        
        osc.start(startTime);
        osc.stop(startTime + dur);
      });
      
      // Add harmony/chord stabs
      const chords = [
        { freqs: [261.63, 329.63, 392.00], start: 0, dur: 0.4 },        // C major
        { freqs: [207.65, 261.63, 311.13], start: 0.75, dur: 0.3 },     // G# major
        { freqs: [233.08, 293.66, 349.23], start: 1.05, dur: 0.3 },     // A# major  
        { freqs: [261.63, 329.63, 392.00], start: 1.35, dur: 0.65 },    // C major
        { freqs: [174.61, 220.00, 261.63], start: 2.0, dur: 0.6 },      // F major
      ];
      
      chords.forEach(({ freqs, start, dur }) => {
        freqs.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.frequency.value = freq;
          osc.type = 'sawtooth';
          
          const startTime = now + start;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.03 * this.masterVolume, startTime + 0.01);
          gain.gain.setValueAtTime(0.03 * this.masterVolume, startTime + dur - 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);
          
          osc.start(startTime);
          osc.stop(startTime + dur);
        });
      });
      
    } catch (error) {
      console.error('Error playing Final Fantasy sound:', error);
    }
  }
  /**
   * ANIMAL SOUNDS - Sheep/Goat bleating
   */
  public playSheepSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // More realistic "baaaaaah" sound
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      // Vibrato for natural voice wobble
      vibrato.frequency.value = 5;
      vibrato.connect(vibratoGain);
      vibratoGain.gain.value = 8;
      vibratoGain.connect(osc1.frequency);
      vibratoGain.connect(osc2.frequency);
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // "B" consonant start
      osc1.frequency.setValueAtTime(150, now);
      osc1.frequency.linearRampToValueAtTime(250, now + 0.05);
      // "aaaaaah" vowel sustain
      osc1.frequency.setValueAtTime(250, now + 0.05);
      osc1.frequency.linearRampToValueAtTime(230, now + 0.6);
      osc1.frequency.linearRampToValueAtTime(200, now + 0.8);
      osc1.type = 'sawtooth';
      
      // Harmonic for nasal quality
      osc2.frequency.setValueAtTime(750, now);
      osc2.frequency.linearRampToValueAtTime(690, now + 0.8);
      osc2.type = 'triangle';
      
      // Formant filter for "aah" sound
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(700, now);
      filter.frequency.linearRampToValueAtTime(800, now + 0.4);
      filter.frequency.linearRampToValueAtTime(700, now + 0.8);
      filter.Q.value = 4;
      
      // Realistic "baaaaaah" envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + 0.08); // Quick "B" attack
      gain.gain.setValueAtTime(0.32 * this.masterVolume, now + 0.15); // Sustain "aaah"
      gain.gain.linearRampToValueAtTime(0.28 * this.masterVolume, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      
      vibrato.start(now);
      osc1.start(now);
      osc2.start(now);
      
      vibrato.stop(now + 0.9);
      osc1.stop(now + 0.9);
      osc2.stop(now + 0.9);
      
    } catch (error) {
      console.error('Error playing sheep sound:', error);
    }
  }

  /**
   * ANIMAL SOUNDS - Cow mooing
   */
  public playCowSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Low "moo" sound
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Deep fundamental
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      osc.frequency.linearRampToValueAtTime(70, now + 0.8);
      osc.type = 'sawtooth';
      
      // Harmonic for richness
      osc2.frequency.setValueAtTime(160, now);
      osc2.frequency.linearRampToValueAtTime(200, now + 0.3);
      osc2.frequency.linearRampToValueAtTime(140, now + 0.8);
      osc2.type = 'triangle';
      
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 3;
      
      // "Moo" envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4 * this.masterVolume, now + 0.1);
      gain.gain.setValueAtTime(0.35 * this.masterVolume, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      
      osc.start(now);
      osc.stop(now + 1.0);
      osc2.start(now);
      osc2.stop(now + 1.0);
      
    } catch (error) {
      console.error('Error playing cow sound:', error);
    }
  }

  /**
   * ANIMAL SOUNDS - Dog barking
   */
  public playDogSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // "Woof" bark sound
      for (let i = 0; i < 2; i++) {
        const barkTime = now + (i * 0.3);
        
        const osc = ctx.createOscillator();
        const noise = this.createWhiteNoise(ctx);
        const gain = ctx.createGain();
        const noiseGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        noise.connect(noiseGain);
        noiseGain.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        // Bark fundamental
        osc.frequency.setValueAtTime(300, barkTime);
        osc.frequency.exponentialRampToValueAtTime(150, barkTime + 0.1);
        osc.type = 'sawtooth';
        
        // Noise for "roughness"
        noiseGain.gain.setValueAtTime(0.05 * this.masterVolume, barkTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, barkTime + 0.1);
        
        filter.type = 'bandpass';
        filter.frequency.value = 500;
        filter.Q.value = 2;
        
        // Sharp attack
        gain.gain.setValueAtTime(0, barkTime);
        gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, barkTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, barkTime + 0.15);
        
        osc.start(barkTime);
        osc.stop(barkTime + 0.15);
        noise.start(barkTime);
        noise.stop(barkTime + 0.1);
      }
      
    } catch (error) {
      console.error('Error playing dog sound:', error);
    }
  }

  /**
   * ANIMAL SOUNDS - Bird chirping
   */
  public playBirdSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Chirping pattern
      const chirps = [
        { freq: 3000, time: 0 },
        { freq: 3500, time: 0.08 },
        { freq: 3200, time: 0.16 },
        { freq: 4000, time: 0.24 },
        { freq: 3800, time: 0.32 },
      ];
      
      chirps.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.setValueAtTime(freq, now + time);
        osc.frequency.linearRampToValueAtTime(freq * 0.9, now + time + 0.05);
        osc.type = 'sine';
        
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        
        const startTime = now + time;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);
        
        osc.start(startTime);
        osc.stop(startTime + 0.06);
      });
      
    } catch (error) {
      console.error('Error playing bird sound:', error);
    }
  }

  /**
   * ANIMAL SOUNDS - Horse neighing
   */
  public playHorseSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Horse whinny/neigh
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Complex frequency modulation for whinny
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.15);
      osc.frequency.linearRampToValueAtTime(600, now + 0.3);
      osc.frequency.linearRampToValueAtTime(400, now + 0.5);
      osc.frequency.linearRampToValueAtTime(300, now + 0.7);
      osc.type = 'sawtooth';
      
      // Harmonic
      osc2.frequency.setValueAtTime(800, now);
      osc2.frequency.linearRampToValueAtTime(1600, now + 0.15);
      osc2.frequency.linearRampToValueAtTime(1200, now + 0.3);
      osc2.frequency.linearRampToValueAtTime(800, now + 0.5);
      osc2.type = 'triangle';
      
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 2;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + 0.05);
      gain.gain.setValueAtTime(0.3 * this.masterVolume, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.start(now);
      osc.stop(now + 0.8);
      osc2.start(now);
      osc2.stop(now + 0.8);
      
    } catch (error) {
      console.error('Error playing horse sound:', error);
    }
  }

  /**
   * GAMEPLAY SOUNDS - SNES-style NPC talking
   */
  public playNpcTalkSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Beep-boop talking sound (like Animal Crossing)
      const syllables = 8; // Random syllables

      for (let i = 0; i < syllables; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        // Random pitch for each "syllable"
        const baseFreq = 200 + Math.random() * 100;
        osc.frequency.value = baseFreq;
        osc.type = 'square';

        const startTime = now + (i * 0.08);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.06);

        osc.start(startTime);
        osc.stop(startTime + 0.06);
      }

    } catch (error) {
      console.error('Error playing NPC talk sound:', error);
    }
  }

  /**
   * EXPERIMENTAL NPC TALK SOUNDS - More realistic speech patterns
   */

  public playNpcTalkV2() {
    // Soft vowel-consonant pattern with natural rhythm
    console.log('🔊 playNpcTalkV2 called, isMuted:', this.isMuted, 'masterVolume:', this.masterVolume);
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Natural speech pattern with vowels and consonants
      const speechPattern = [
        { type: 'vowel', duration: 0.12 },
        { type: 'consonant', duration: 0.06 },
        { type: 'vowel', duration: 0.08 },
        { type: 'consonant', duration: 0.04 },
        { type: 'vowel', duration: 0.15 },
        { type: 'pause', duration: 0.08 },
        { type: 'consonant', duration: 0.05 },
        { type: 'vowel', duration: 0.10 },
        { type: 'consonant', duration: 0.06 },
      ];

      let timeOffset = 0;
      speechPattern.forEach(({ type, duration }) => {
        const startTime = now + timeOffset;

        if (type === 'vowel') {
          // Soft sine wave for vowels
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'sine';
          osc.frequency.value = 150 + Math.random() * 60; // Lower, warmer vowels

          filter.type = 'lowpass';
          filter.frequency.value = 800;
          filter.Q.value = 2;

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc.start(startTime);
          osc.stop(startTime + duration);

        } else if (type === 'consonant') {
          // Filtered noise for consonants
          const noise = ctx.createBufferSource();
          const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
          const data = buffer.getChannelData(0);

          for (let i = 0; i < buffer.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
          }
          noise.buffer = buffer;

          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          noise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          filter.type = 'bandpass';
          filter.frequency.value = 2000 + Math.random() * 1000;
          filter.Q.value = 3;

          gain.gain.setValueAtTime(0.08 * this.masterVolume, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          noise.start(startTime);
        }

        timeOffset += duration;
      });

    } catch (error) {
      console.error('Error playing NPC talk V2 sound:', error);
    }
  }

  public playNpcTalkV3() {
    // Gentle pitter-patter with formant-like filtering
    console.log('🔊 playNpcTalkV3 called, isMuted:', this.isMuted, 'masterVolume:', this.masterVolume);
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // More natural rhythmic pattern
      const syllables = 6 + Math.floor(Math.random() * 4);
      const baseTiming = [0.1, 0.08, 0.12, 0.06, 0.11, 0.09, 0.07, 0.13, 0.05];

      let timeOffset = 0;
      for (let i = 0; i < syllables; i++) {
        const duration = baseTiming[i % baseTiming.length];
        const startTime = now + timeOffset;

        // Combine filtered noise with soft tone
        const tone = ctx.createOscillator();
        const noise = ctx.createBufferSource();
        const toneGain = ctx.createGain();
        const noiseGain = ctx.createGain();
        const masterGain = ctx.createGain();
        const formantFilter = ctx.createBiquadFilter();

        // Create short noise burst
        const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < buffer.length; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (buffer.length * 0.3));
        }
        noise.buffer = buffer;

        // Soft tone for vowel-like quality
        tone.type = 'triangle';
        tone.frequency.value = 120 + Math.random() * 80;

        // Formant-like filtering
        formantFilter.type = 'bandpass';
        formantFilter.frequency.value = 400 + Math.random() * 600;
        formantFilter.Q.value = 4;

        tone.connect(toneGain);
        noise.connect(noiseGain);
        toneGain.connect(formantFilter);
        noiseGain.connect(formantFilter);
        formantFilter.connect(masterGain);
        masterGain.connect(ctx.destination);

        // Natural envelope
        const volume = 0.10 * this.masterVolume * (0.7 + Math.random() * 0.3);
        toneGain.gain.setValueAtTime(volume * 0.7, startTime);
        noiseGain.gain.setValueAtTime(volume * 0.3, startTime);
        masterGain.gain.setValueAtTime(1, startTime);
        masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        tone.start(startTime);
        tone.stop(startTime + duration);
        noise.start(startTime);

        timeOffset += duration + (Math.random() * 0.03); // Small random pauses
      }

    } catch (error) {
      console.error('Error playing NPC talk V3 sound:', error);
    }
  }

  public playNpcTalkV4() {
    // Whispered conversation style with breath-like quality
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Breath-like whispered speech
      const phrases = 3; // Short phrases
      let timeOffset = 0;

      for (let phrase = 0; phrase < phrases; phrase++) {
        const syllablesInPhrase = 2 + Math.floor(Math.random() * 3);

        for (let i = 0; i < syllablesInPhrase; i++) {
          const startTime = now + timeOffset;
          const duration = 0.08 + Math.random() * 0.06;

          // Breathy noise with pitch modulation
          const noise = ctx.createBufferSource();
          const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
          const data = buffer.getChannelData(0);

          for (let j = 0; j < buffer.length; j++) {
            const breathiness = Math.sin(j * 0.01) * 0.5 + 0.5; // Breath modulation
            data[j] = (Math.random() * 2 - 1) * breathiness * Math.exp(-j / (buffer.length * 0.6));
          }
          noise.buffer = buffer;

          const gain = ctx.createGain();
          const filter1 = ctx.createBiquadFilter();
          const filter2 = ctx.createBiquadFilter();

          noise.connect(filter1);
          filter1.connect(filter2);
          filter2.connect(gain);
          gain.connect(ctx.destination);

          // Vocal-like filtering
          filter1.type = 'highpass';
          filter1.frequency.value = 200;
          filter1.Q.value = 1;

          filter2.type = 'lowpass';
          filter2.frequency.value = 1500 + Math.random() * 500;
          filter2.Q.value = 2;

          gain.gain.setValueAtTime(0.08 * this.masterVolume, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          noise.start(startTime);

          timeOffset += duration + 0.02;
        }

        // Pause between phrases
        timeOffset += 0.15;
      }

    } catch (error) {
      console.error('Error playing NPC talk V4 sound:', error);
    }
  }

  public playNpcTalkV5() {
    // Subtle mouth sounds with natural speech rhythm
    console.log('🔊 playNpcTalkV5 called, isMuted:', this.isMuted, 'masterVolume:', this.masterVolume);
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Natural conversation with varied syllable lengths
      const words = 4;
      let timeOffset = 0;

      for (let word = 0; word < words; word++) {
        const syllables = 1 + Math.floor(Math.random() * 3);

        for (let syl = 0; syl < syllables; syl++) {
          const startTime = now + timeOffset;
          const duration = 0.06 + Math.random() * 0.08;

          // Subtle mouth/lip sounds
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          // Two subtle frequencies for natural speech texture
          osc1.type = 'triangle';
          osc2.type = 'sine';
          osc1.frequency.value = 80 + Math.random() * 40;   // Low fundamental
          osc2.frequency.value = 300 + Math.random() * 200; // Higher formant

          filter.type = 'bandpass';
          filter.frequency.value = 500 + Math.random() * 800;
          filter.Q.value = 3;

          // Natural speech envelope with slight randomness
          const volume = 0.08 * this.masterVolume * (0.8 + Math.random() * 0.4);
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

          osc1.start(startTime);
          osc1.stop(startTime + duration);
          osc2.start(startTime);
          osc2.stop(startTime + duration);

          timeOffset += duration + (Math.random() * 0.02);
        }

        // Pause between words
        timeOffset += 0.08 + Math.random() * 0.05;
      }

    } catch (error) {
      console.error('Error playing NPC talk V5 sound:', error);
    }
  }

  /**
   * GAMEPLAY SOUNDS - Level up fanfare
   */
  public playLevelUpFanfareSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Ascending triumphant arpeggio
      const notes = [
        { freq: 523.25, delay: 0 },      // C5
        { freq: 659.25, delay: 0.05 },   // E5
        { freq: 783.99, delay: 0.1 },    // G5
        { freq: 1046.50, delay: 0.15 },  // C6
        { freq: 1318.51, delay: 0.25 },  // E6
        { freq: 1567.98, delay: 0.35 },  // G6
        { freq: 2093.00, delay: 0.45 },  // C7
      ];
      
      notes.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'square';
        
        const startTime = now + delay;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
        
        osc.start(startTime);
        osc.stop(startTime + 0.8);
      });
      
    } catch (error) {
      console.error('Error playing level up sound:', error);
    }
  }

  /**
   * GAMEPLAY SOUNDS - Magic spell casting
   */
  public playSpellCastSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Mystical whoosh and sparkle
      const osc = ctx.createOscillator();
      const noise = this.createWhiteNoise(ctx);
      const gain = ctx.createGain();
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(gain);
      noise.connect(filter);
      filter.connect(noiseGain);
      gain.connect(ctx.destination);
      noiseGain.connect(ctx.destination);
      
      // Rising tone
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
      osc.type = 'sine';
      
      // Filtered noise for "magic" texture
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      filter.frequency.exponentialRampToValueAtTime(5000, now + 0.5);
      filter.Q.value = 10;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.05);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc.start(now);
      osc.stop(now + 0.6);
      noise.start(now);
      noise.stop(now + 0.5);
      
    } catch (error) {
      console.error('Error playing spell cast sound:', error);
    }
  }

  /**
   * GAMEPLAY SOUNDS - Merchant shop bell
   */
  public playMerchantBellSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Shop bell "ding-a-ling"
      const bells = [
        { freq: 2637, time: 0 },      // E7
        { freq: 3136, time: 0.1 },    // G7
        { freq: 2637, time: 0.2 },    // E7
      ];
      
      bells.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc2.frequency.value = freq * 2.01; // Slight detune for bell shimmer
        osc.type = 'sine';
        osc2.type = 'sine';
        
        const startTime = now + time;
        gain.gain.setValueAtTime(0.2 * this.masterVolume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);
        
        osc.start(startTime);
        osc.stop(startTime + 1.0);
        osc2.start(startTime);
        osc2.stop(startTime + 1.0);
      });
      
    } catch (error) {
      console.error('Error playing merchant bell sound:', error);
    }
  }

  /**
   * GAMEPLAY SOUNDS - Puzzle solved
   */
  public playPuzzleSolvedSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Satisfying resolution chord
      const notes = [
        { freq: 261.63, delay: 0 },      // C4
        { freq: 329.63, delay: 0 },      // E4
        { freq: 392.00, delay: 0 },      // G4
        { freq: 523.25, delay: 0.1 },    // C5
        { freq: 659.25, delay: 0.1 },    // E5
        { freq: 783.99, delay: 0.1 },    // G5
        { freq: 1046.50, delay: 0.2 },   // C6
      ];
      
      notes.forEach(({ freq, delay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'triangle';
        
        filter.type = 'lowpass';
        filter.frequency.value = freq * 3;
        
        const startTime = now + delay;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);
        
        osc.start(startTime);
        osc.stop(startTime + 1.5);
      });
      
    } catch (error) {
      console.error('Error playing puzzle solved sound:', error);
    }
  }

  /**
   * MORE ANIMAL SOUNDS - Cat meowing
   */
  public playCatSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // "Meow" sound
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // "Me" part rising, "ow" part falling
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.15);
      osc.frequency.linearRampToValueAtTime(500, now + 0.35);
      osc.frequency.linearRampToValueAtTime(300, now + 0.5);
      osc.type = 'sawtooth';
      
      // Harmonics
      osc2.frequency.setValueAtTime(800, now);
      osc2.frequency.linearRampToValueAtTime(1600, now + 0.15);
      osc2.frequency.linearRampToValueAtTime(1000, now + 0.35);
      osc2.type = 'sine';
      
      filter.type = 'bandpass';
      filter.frequency.value = 1200;
      filter.Q.value = 3;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + 0.05);
      gain.gain.setValueAtTime(0.2 * this.masterVolume, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      
      osc.start(now);
      osc.stop(now + 0.6);
      osc2.start(now);
      osc2.stop(now + 0.6);
      
    } catch (error) {
      console.error('Error playing cat sound:', error);
    }
  }

  /**
   * MORE ANIMAL SOUNDS - Pig oinking
   */
  public playPigSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // "Oink oink" sound
      for (let i = 0; i < 2; i++) {
        const oinkTime = now + (i * 0.3);
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        // Quick rise and fall for "oink"
        osc.frequency.setValueAtTime(200, oinkTime);
        osc.frequency.linearRampToValueAtTime(400, oinkTime + 0.05);
        osc.frequency.linearRampToValueAtTime(250, oinkTime + 0.15);
        osc.type = 'sawtooth';
        
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 5;
        
        gain.gain.setValueAtTime(0, oinkTime);
        gain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, oinkTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, oinkTime + 0.2);
        
        osc.start(oinkTime);
        osc.stop(oinkTime + 0.2);
      }
      
    } catch (error) {
      console.error('Error playing pig sound:', error);
    }
  }

  /**
   * MORE ANIMAL SOUNDS - Rooster crowing
   */
  public playRoosterSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // "Cock-a-doodle-doo" sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Complex frequency pattern for crow
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.1);
      osc.frequency.setValueAtTime(1000, now + 0.15);
      osc.frequency.linearRampToValueAtTime(800, now + 0.3);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.4);
      osc.frequency.linearRampToValueAtTime(900, now + 0.6);
      osc.frequency.linearRampToValueAtTime(600, now + 0.8);
      osc.type = 'sawtooth';
      
      filter.type = 'bandpass';
      filter.frequency.value = 1500;
      filter.Q.value = 2;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + 0.05);
      gain.gain.setValueAtTime(0.3 * this.masterVolume, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      
      osc.start(now);
      osc.stop(now + 1.0);
      
    } catch (error) {
      console.error('Error playing rooster sound:', error);
    }
  }

  /**
   * MORE ANIMAL SOUNDS - Duck quacking
   */
  public playDuckSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // "Quack quack" sound
      for (let i = 0; i < 2; i++) {
        const quackTime = now + (i * 0.25);
        
        const osc = ctx.createOscillator();
        const noise = this.createWhiteNoise(ctx);
        const gain = ctx.createGain();
        const noiseGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        noise.connect(noiseGain);
        noiseGain.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        // Nasal "quack"
        osc.frequency.value = 300;
        osc.type = 'sawtooth';
        
        // Add noise for texture
        noiseGain.gain.value = 0.02 * this.masterVolume;
        
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 8;
        
        gain.gain.setValueAtTime(0, quackTime);
        gain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, quackTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, quackTime + 0.15);
        
        osc.start(quackTime);
        osc.stop(quackTime + 0.15);
        noise.start(quackTime);
        noise.stop(quackTime + 0.15);
      }
      
    } catch (error) {
      console.error('Error playing duck sound:', error);
    }
  }

  /**
   * MORE ANIMAL SOUNDS - Frog croaking
   */
  public playFrogSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // "Ribbit" sound
      for (let i = 0; i < 2; i++) {
        const croakTime = now + (i * 0.3);
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        // Low croak
        osc.frequency.setValueAtTime(80, croakTime);
        osc.frequency.linearRampToValueAtTime(120, croakTime + 0.05);
        osc.frequency.linearRampToValueAtTime(80, croakTime + 0.15);
        osc.type = 'sawtooth';
        
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        filter.Q.value = 10;
        
        gain.gain.setValueAtTime(0, croakTime);
        gain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, croakTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, croakTime + 0.2);
        
        osc.start(croakTime);
        osc.stop(croakTime + 0.2);
      }
      
    } catch (error) {
      console.error('Error playing frog sound:', error);
    }
  }

  /**
   * MORE ANIMAL SOUNDS - Cricket chirping
   */
  public playCricketSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Rapid chirping
      for (let i = 0; i < 6; i++) {
        const chirpTime = now + (i * 0.05);
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = 4500;
        osc.type = 'sine';
        
        gain.gain.setValueAtTime(0, chirpTime);
        gain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, chirpTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, chirpTime + 0.03);
        
        osc.start(chirpTime);
        osc.stop(chirpTime + 0.03);
      }
      
    } catch (error) {
      console.error('Error playing cricket sound:', error);
    }
  }

  /**
   * MORE ANIMAL SOUNDS - Owl hooting
   */
  public playOwlSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // "Hoo hoo" sound
      for (let i = 0; i < 2; i++) {
        const hootTime = now + (i * 0.5);
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        // Deep hollow hoot
        osc.frequency.value = 250;
        osc.type = 'sine';
        
        filter.type = 'bandpass';
        filter.frequency.value = 300;
        filter.Q.value = 1;
        
        gain.gain.setValueAtTime(0, hootTime);
        gain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, hootTime + 0.1);
        gain.gain.setValueAtTime(0.2 * this.masterVolume, hootTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, hootTime + 0.4);
        
        osc.start(hootTime);
        osc.stop(hootTime + 0.4);
      }
      
    } catch (error) {
      console.error('Error playing owl sound:', error);
    }
  }

  /**
   * MORE ANIMAL SOUNDS - Wolf howling
   */
  public playWolfSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Long howl
      const osc = ctx.createOscillator();
      const vibrato = ctx.createOscillator();
      const vibratoGain = ctx.createGain();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      // Add vibrato for realistic howl
      vibrato.frequency.value = 4;
      vibrato.connect(vibratoGain);
      vibratoGain.gain.value = 20;
      vibratoGain.connect(osc.frequency);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Rising and falling howl
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(500, now + 0.5);
      osc.frequency.linearRampToValueAtTime(400, now + 1.0);
      osc.frequency.linearRampToValueAtTime(300, now + 1.5);
      osc.type = 'sawtooth';
      
      filter.type = 'lowpass';
      filter.frequency.value = 1000;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.2);
      gain.gain.setValueAtTime(0.25 * this.masterVolume, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      
      vibrato.start(now);
      osc.start(now);
      vibrato.stop(now + 1.8);
      osc.stop(now + 1.8);
      
    } catch (error) {
      console.error('Error playing wolf sound:', error);
    }
  }

  /**
   * MORE ANIMAL SOUNDS - Elephant trumpeting
   */
  public playElephantSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Trumpet sound
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Complex trumpet pattern
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(300, now + 0.2);
      osc.frequency.setValueAtTime(280, now + 0.3);
      osc.frequency.linearRampToValueAtTime(200, now + 0.6);
      osc.frequency.linearRampToValueAtTime(250, now + 0.8);
      osc.frequency.linearRampToValueAtTime(150, now + 1.0);
      osc.type = 'sawtooth';
      
      // Harmonic
      osc2.frequency.setValueAtTime(300, now);
      osc2.frequency.linearRampToValueAtTime(600, now + 0.2);
      osc2.frequency.linearRampToValueAtTime(400, now + 1.0);
      osc2.type = 'square';
      
      filter.type = 'bandpass';
      filter.frequency.value = 400;
      filter.Q.value = 2;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4 * this.masterVolume, now + 0.1);
      gain.gain.setValueAtTime(0.35 * this.masterVolume, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      
      osc.start(now);
      osc.stop(now + 1.2);
      osc2.start(now);
      osc2.stop(now + 1.2);
      
    } catch (error) {
      console.error('Error playing elephant sound:', error);
    }
  }

  /**
   * MORE ANIMAL SOUNDS - Monkey screeching
   */
  public playMonkeySound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // "Ooh ooh ah ah" pattern
      const pattern = [
        { freq: 800, time: 0 },
        { freq: 1000, time: 0.1 },
        { freq: 600, time: 0.2 },
        { freq: 1200, time: 0.3 },
        { freq: 900, time: 0.4 },
      ];
      
      pattern.forEach(({ freq, time }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        osc.frequency.value = freq;
        osc.type = 'sawtooth';
        
        filter.type = 'highpass';
        filter.frequency.value = 500;
        
        const startTime = now + time;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.08);
        
        osc.start(startTime);
        osc.stop(startTime + 0.08);
      });
      
    } catch (error) {
      console.error('Error playing monkey sound:', error);
    }
  }

  /**
   * COMBAT SOUNDS - Sword chop attack
   */
  public playChopSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Heavy chop sound
      const noise = this.createWhiteNoise(ctx);
      const osc = ctx.createOscillator();
      const noiseGain = ctx.createGain();
      const oscGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      // Whoosh
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);

      // Impact thud
      osc.frequency.value = 60;
      osc.type = 'triangle';

      noiseGain.gain.setValueAtTime(0.3 * this.masterVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      oscGain.gain.setValueAtTime(0.4 * this.masterVolume, now + 0.08);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      noise.start(now);
      noise.stop(now + 0.15);
      osc.start(now + 0.08);
      osc.stop(now + 0.2);

    } catch (error) {
      console.error('Error playing chop sound:', error);
    }
  }

  /**
   * SKILL SOUNDS - Digging in earth
   */
  public playDigSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Create digging sounds with multiple components
      const noise = this.createWhiteNoise(ctx);
      const scrapeOsc = ctx.createOscillator();
      const thudOsc = ctx.createOscillator();

      const noiseGain = ctx.createGain();
      const scrapeGain = ctx.createGain();
      const thudGain = ctx.createGain();

      const filter = ctx.createBiquadFilter();
      const scrapeFilter = ctx.createBiquadFilter();

      // Connect noise through filter
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      // Connect scrape oscillator
      scrapeOsc.connect(scrapeFilter);
      scrapeFilter.connect(scrapeGain);
      scrapeGain.connect(ctx.destination);

      // Connect thud
      thudOsc.connect(thudGain);
      thudGain.connect(ctx.destination);

      // Earth/gravel sound
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(300, now + 0.3);
      filter.Q.value = 1;

      // Scraping sound
      scrapeOsc.type = 'sawtooth';
      scrapeOsc.frequency.setValueAtTime(150, now);
      scrapeOsc.frequency.exponentialRampToValueAtTime(80, now + 0.3);

      scrapeFilter.type = 'bandpass';
      scrapeFilter.frequency.value = 400;
      scrapeFilter.Q.value = 5;

      // Deep thud
      thudOsc.type = 'sine';
      thudOsc.frequency.value = 45;

      // Volume envelopes
      noiseGain.gain.setValueAtTime(0.2 * this.masterVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      scrapeGain.gain.setValueAtTime(0, now);
      scrapeGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.02);
      scrapeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      thudGain.gain.setValueAtTime(0.3 * this.masterVolume, now + 0.15);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      // Start and stop
      noise.start(now);
      noise.stop(now + 0.3);
      scrapeOsc.start(now);
      scrapeOsc.stop(now + 0.25);
      thudOsc.start(now + 0.15);
      thudOsc.stop(now + 0.35);

    } catch (error) {
      console.error('Error playing dig sound:', error);
    }
  }

  /**
   * SKILL SOUNDS - Foraging/rustling in vegetation
   */
  public playForageSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Create rustling sounds
      const noise1 = this.createWhiteNoise(ctx);
      const noise2 = this.createWhiteNoise(ctx);

      const gain1 = ctx.createGain();
      const gain2 = ctx.createGain();

      const filter1 = ctx.createBiquadFilter();
      const filter2 = ctx.createBiquadFilter();

      // Connect chains
      noise1.connect(filter1);
      filter1.connect(gain1);
      gain1.connect(ctx.destination);

      noise2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(ctx.destination);

      // Soft rustling
      filter1.type = 'bandpass';
      filter1.frequency.setValueAtTime(2000, now);
      filter1.frequency.exponentialRampToValueAtTime(1000, now + 0.2);
      filter1.Q.value = 2;

      // Leafy sounds
      filter2.type = 'highpass';
      filter2.frequency.setValueAtTime(4000, now);
      filter2.frequency.exponentialRampToValueAtTime(2000, now + 0.3);

      // Gentle volume envelope
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.05);
      gain1.gain.linearRampToValueAtTime(0.05 * this.masterVolume, now + 0.1);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.08 * this.masterVolume, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      // Start and stop
      noise1.start(now);
      noise1.stop(now + 0.2);
      noise2.start(now + 0.1);
      noise2.stop(now + 0.3);

    } catch (error) {
      console.error('Error playing forage sound:', error);
    }
  }

  /**
   * SKILL SOUNDS - Burning/fire crackling
   */
  public playBurnSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Create fire sounds
      const crackleNoise = this.createWhiteNoise(ctx);
      const wooshNoise = this.createWhiteNoise(ctx);
      const popOsc = ctx.createOscillator();

      const crackleGain = ctx.createGain();
      const wooshGain = ctx.createGain();
      const popGain = ctx.createGain();

      const crackleFilter = ctx.createBiquadFilter();
      const wooshFilter = ctx.createBiquadFilter();

      // Connect crackling
      crackleNoise.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(ctx.destination);

      // Connect whoosh
      wooshNoise.connect(wooshFilter);
      wooshFilter.connect(wooshGain);
      wooshGain.connect(ctx.destination);

      // Connect pop
      popOsc.connect(popGain);
      popGain.connect(ctx.destination);

      // Crackling fire
      crackleFilter.type = 'bandpass';
      crackleFilter.frequency.value = 1500;
      crackleFilter.Q.value = 0.5;

      // Whoosh of flames
      wooshFilter.type = 'lowpass';
      wooshFilter.frequency.setValueAtTime(500, now);
      wooshFilter.frequency.exponentialRampToValueAtTime(200, now + 0.5);

      // Popping sound
      popOsc.type = 'sine';
      popOsc.frequency.setValueAtTime(200, now + 0.2);
      popOsc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

      // Volume envelopes for fire effect
      crackleGain.gain.setValueAtTime(0, now);
      crackleGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.05);
      // Add some randomness to crackling
      crackleGain.gain.setValueAtTime(0.1 * this.masterVolume, now + 0.1);
      crackleGain.gain.setValueAtTime(0.15 * this.masterVolume, now + 0.15);
      crackleGain.gain.setValueAtTime(0.08 * this.masterVolume, now + 0.2);
      crackleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      wooshGain.gain.setValueAtTime(0.2 * this.masterVolume, now);
      wooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      popGain.gain.setValueAtTime(0, now + 0.2);
      popGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.21);
      popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      // Start and stop
      crackleNoise.start(now);
      crackleNoise.stop(now + 0.5);
      wooshNoise.start(now);
      wooshNoise.stop(now + 0.5);
      popOsc.start(now + 0.2);
      popOsc.stop(now + 0.25);

    } catch (error) {
      console.error('Error playing burn sound:', error);
    }
  }

  /**
   * COMBAT SOUNDS - Sword slash attack
   */
  public playSlashSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Quick slash sound
      const noise = this.createWhiteNoise(ctx);
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Fast whoosh
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      noise.start(now);
      noise.stop(now + 0.1);
      
    } catch (error) {
      console.error('Error playing slash sound:', error);
    }
  }

  /**
   * COMBAT SOUNDS - Stab/pierce attack
   */
  public playStabSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Sharp stab sound
      const osc = ctx.createOscillator();
      const noise = this.createWhiteNoise(ctx);
      const oscGain = ctx.createGain();
      const noiseGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      // High pitched "shing"
      osc.frequency.setValueAtTime(2000, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
      osc.type = 'sawtooth';
      
      // Whoosh
      filter.type = 'bandpass';
      filter.frequency.value = 4000;
      filter.Q.value = 5;
      
      oscGain.gain.setValueAtTime(0.15 * this.masterVolume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      noiseGain.gain.setValueAtTime(0.1 * this.masterVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      
      osc.start(now);
      osc.stop(now + 0.08);
      noise.start(now);
      noise.stop(now + 0.05);
      
    } catch (error) {
      console.error('Error playing stab sound:', error);
    }
  }

  /**
   * COMBAT SOUNDS - Blunt/crush attack
   */
  public playCrushSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Heavy thud
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Deep impact
      osc.frequency.value = 40;
      osc.type = 'sine';
      
      osc2.frequency.value = 80;
      osc2.type = 'triangle';
      
      filter.type = 'lowpass';
      filter.frequency.value = 150;
      
      gain.gain.setValueAtTime(0.5 * this.masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.3);
      osc2.start(now);
      osc2.stop(now + 0.3);
      
    } catch (error) {
      console.error('Error playing crush sound:', error);
    }
  }

  /**
   * COMBAT SOUNDS - Arrow/projectile
   */
  public playArrowSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Whizzing arrow
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      // Descending whizz
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.3);
      osc.type = 'sawtooth';
      
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 10;
      
      gain.gain.setValueAtTime(0.15 * this.masterVolume, now);
      gain.gain.setValueAtTime(0.1 * this.masterVolume, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      
      osc.start(now);
      osc.stop(now + 0.3);
      
    } catch (error) {
      console.error('Error playing arrow sound:', error);
    }
  }

  /**
   * IMPACT SOUND - Play when attack hits target
   */
  public playImpactSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Create impact thud
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.3));
      }
      
      noise.buffer = buffer;
      
      // Filter for body impact
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 1;
      
      const gain = ctx.createGain();
      gain.gain.value = 0.5;
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start(now);
      
      // Add a subtle punch sound
      const punch = ctx.createOscillator();
      punch.frequency.value = 60;
      
      const punchGain = ctx.createGain();
      punchGain.gain.setValueAtTime(0.3, now);
      punchGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      punch.connect(punchGain);
      punchGain.connect(ctx.destination);
      
      punch.start(now);
      punch.stop(now + 0.1);
      
    } catch (error) {
      console.error('Error playing impact sound:', error);
    }
  }

  /**
   * CRITICAL HIT SOUND - Play on critical strikes
   */
  public playCriticalHitSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Powerful impact with reverb
      const osc = ctx.createOscillator();
      osc.frequency.value = 40;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      
      // Add distortion for power
      const distortion = ctx.createWaveShaper();
      const samples = 44100;
      const curve = new Float32Array(samples);
      for (let i = 0; i < samples; i++) {
        const x = (i * 2) / samples - 1;
        curve[i] = Math.tanh(x * 5);
      }
      distortion.curve = curve;
      
      // Shimmer effect
      const shimmer = ctx.createOscillator();
      shimmer.frequency.value = 2000;
      
      const shimmerGain = ctx.createGain();
      shimmerGain.gain.setValueAtTime(0, now);
      shimmerGain.gain.linearRampToValueAtTime(0.2, now + 0.05);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      osc.connect(gain);
      gain.connect(distortion);
      distortion.connect(ctx.destination);
      
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.3);
      shimmer.start(now);
      shimmer.stop(now + 0.4);
      
    } catch (error) {
      console.error('Error playing critical hit sound:', error);
    }
  }

  /**
   * HURT SOUND - Play when player takes damage
   */
  public playHurtSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Pain grunt
      const osc = ctx.createOscillator();
      osc.frequency.value = 150;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      // Formant filter for "ugh" sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 700;
      filter.Q.value = 5;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.15);
      
    } catch (error) {
      console.error('Error playing hurt sound:', error);
    }
  }

  /**
   * BLOCK SOUND - Play when attack is blocked
   */
  public playBlockSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Metallic clang
      const osc1 = ctx.createOscillator();
      osc1.frequency.value = 800;
      
      const osc2 = ctx.createOscillator();
      osc2.frequency.value = 1200;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      // High resonance for metallic sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 10;
      
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start(now);
      osc1.stop(now + 0.1);
      osc2.start(now);
      osc2.stop(now + 0.08);
      
    } catch (error) {
      console.error('Error playing block sound:', error);
    }
  }

  /**
   * DODGE SOUND - Play when player dodges attack
   */
  public playDodgeSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Swoosh sound
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      noise.buffer = buffer;
      
      // Swept filter for swoosh
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3000, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);
      filter.Q.value = 2;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start(now);
      
    } catch (error) {
      console.error('Error playing dodge sound:', error);
    }
  }

  /**
   * SHIELD SOUND - Play when defending
   */
  public playShieldSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Resonant shield raise
      const osc = ctx.createOscillator();
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.1);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      // Metallic resonance
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 8;
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.2);
      
    } catch (error) {
      console.error('Error playing shield sound:', error);
    }
  }

  /**
   * BITE SOUND - Play for animal bite attacks
   */
  public playBiteSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Crunch sound
      const noise = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < buffer.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.2));
      }
      
      noise.buffer = buffer;
      
      // Sharp attack
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      
      const gain = ctx.createGain();
      gain.gain.value = 0.4;
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start(now);
      
      // Add snap
      const snap = ctx.createOscillator();
      snap.frequency.value = 2000;
      
      const snapGain = ctx.createGain();
      snapGain.gain.setValueAtTime(0.3, now);
      snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
      
      snap.connect(snapGain);
      snapGain.connect(ctx.destination);
      
      snap.start(now);
      snap.stop(now + 0.03);
      
    } catch (error) {
      console.error('Error playing bite sound:', error);
    }
  }

  /**
   * FOOTSTEPS - Play footstep sound based on floor material type
   */
  public playFootstepSound(material: 'stone' | 'marble' | 'wood' | 'carpet' | 'tile' | 'tatami' | 'metal' | 'sand' | 'rustle' | 'bell' = 'stone') {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      switch(material) {
        case 'stone':
        case 'tile':
          // Subtle stone step - like tatami but slightly rougher
          const stoneNoise = ctx.createBufferSource();
          const stoneBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
          const stoneData = stoneBuffer.getChannelData(0);

          // Generate noise with slightly more roughness than tatami
          for (let i = 0; i < stoneBuffer.length; i++) {
            stoneData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (stoneBuffer.length * 0.4));
          }

          stoneNoise.buffer = stoneBuffer;

          const stoneGain = ctx.createGain();
          const stoneFilter = ctx.createBiquadFilter();

          // Less warm than tatami, but still natural
          stoneFilter.type = 'lowpass';
          stoneFilter.frequency.value = 600; // Slightly less warm than tatami (800)
          stoneFilter.Q.value = 1;

          stoneNoise.connect(stoneFilter);
          stoneFilter.connect(stoneGain);
          stoneGain.connect(ctx.destination);

          stoneGain.gain.setValueAtTime(0.07 * this.masterVolume, now); // Slightly louder than tatami (0.06)
          stoneGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

          stoneNoise.start(now);
          break;
          
        case 'marble':
          // Similar to stone but brighter/sharper
          const marbleStep = ctx.createOscillator();
          const marbleGain = ctx.createGain();
          const marbleFilter = ctx.createBiquadFilter();
          
          marbleStep.connect(marbleFilter);
          marbleFilter.connect(marbleGain);
          marbleGain.connect(ctx.destination);
          
          marbleStep.type = 'triangle';
          marbleStep.frequency.value = 150;
          
          marbleFilter.type = 'highpass';
          marbleFilter.frequency.value = 300;
          marbleFilter.Q.value = 2;
          
          marbleGain.gain.setValueAtTime(0.1 * this.masterVolume, now);
          marbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
          
          marbleStep.start(now);
          marbleStep.stop(now + 0.06);
          
          // High click
          const marbleClick = ctx.createOscillator();
          const marbleClickGain = ctx.createGain();
          
          marbleClick.connect(marbleClickGain);
          marbleClickGain.connect(ctx.destination);
          
          marbleClick.type = 'sine';
          marbleClick.frequency.value = 2400;
          
          marbleClickGain.gain.setValueAtTime(0.05 * this.masterVolume, now);
          marbleClickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.015);
          
          marbleClick.start(now);
          marbleClick.stop(now + 0.015);
          break;
          
        case 'wood':
        case 'tatami':
          // Natural wood step - similar to default but slightly warmer
          const woodNoise = ctx.createBufferSource();
          const woodBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
          const woodData = woodBuffer.getChannelData(0);
          
          // Generate noise with slight warmth
          for (let i = 0; i < woodBuffer.length; i++) {
            woodData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (woodBuffer.length * 0.5));
          }
          
          woodNoise.buffer = woodBuffer;
          
          const woodGain = ctx.createGain();
          const woodFilter = ctx.createBiquadFilter();
          
          // Warm, natural filter
          woodFilter.type = 'lowpass';
          woodFilter.frequency.value = 800;
          woodFilter.Q.value = 1;
          
          woodNoise.connect(woodFilter);
          woodFilter.connect(woodGain);
          woodGain.connect(ctx.destination);
          
          woodGain.gain.setValueAtTime(0.042 * this.masterVolume, now); // 30% softer than before (0.06 * 0.7)
          woodGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          
          woodNoise.start(now);
          
          // Subtle wood tap for distinction
          if (material === 'wood') {
            const tap = ctx.createOscillator();
            const tapGain = ctx.createGain();
            
            tap.connect(tapGain);
            tapGain.connect(ctx.destination);
            
            tap.type = 'sine';
            tap.frequency.value = 300;
            
            tapGain.gain.setValueAtTime(0.02 * this.masterVolume, now);
            tapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
            
            tap.start(now);
            tap.stop(now + 0.03);
          }
          break;
          
        case 'carpet':
          // Muffled soft thud
          const carpetNoise = this.createWhiteNoise(ctx);
          const carpetGain = ctx.createGain();
          const carpetFilter = ctx.createBiquadFilter();
          
          carpetNoise.connect(carpetFilter);
          carpetFilter.connect(carpetGain);
          carpetGain.connect(ctx.destination);
          
          carpetFilter.type = 'lowpass';
          carpetFilter.frequency.value = 200;
          carpetFilter.Q.value = 5;
          
          carpetGain.gain.setValueAtTime(0.04 * this.masterVolume, now);
          carpetGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          
          carpetNoise.start(now);
          carpetNoise.stop(now + 0.05);
          
          // Very soft bass thump
          const carpetThump = ctx.createOscillator();
          const carpetThumpGain = ctx.createGain();
          
          carpetThump.connect(carpetThumpGain);
          carpetThumpGain.connect(ctx.destination);
          
          carpetThump.type = 'sine';
          carpetThump.frequency.value = 60;
          
          carpetThumpGain.gain.setValueAtTime(0.03 * this.masterVolume, now);
          carpetThumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
          
          carpetThump.start(now);
          carpetThump.stop(now + 0.04);
          break;
          
        case 'metal':
          // Metallic clang
          const metalStep = ctx.createOscillator();
          const metalGain = ctx.createGain();
          const metalFilter = ctx.createBiquadFilter();
          
          metalStep.connect(metalFilter);
          metalFilter.connect(metalGain);
          metalGain.connect(ctx.destination);
          
          metalStep.type = 'square';
          metalStep.frequency.value = 240;
          
          metalFilter.type = 'bandpass';
          metalFilter.frequency.value = 800;
          metalFilter.Q.value = 10;
          
          metalGain.gain.setValueAtTime(0.08 * this.masterVolume, now);
          metalGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          
          metalStep.start(now);
          metalStep.stop(now + 0.12);
          
          // Ring
          const ring = ctx.createOscillator();
          const ringGain = ctx.createGain();
          
          ring.connect(ringGain);
          ringGain.connect(ctx.destination);
          
          ring.type = 'sine';
          ring.frequency.value = 1600;
          
          ringGain.gain.setValueAtTime(0.02 * this.masterVolume, now);
          ringGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          
          ring.start(now);
          ring.stop(now + 0.2);
          break;
          
        case 'sand':
          // Subtle sandy step - like tatami but with more texture
          const sandNoiseBuffer = ctx.createBufferSource();
          const sandBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
          const sandData = sandBuffer.getChannelData(0);

          // Generate noise with sandy texture - more random than tatami
          for (let i = 0; i < sandBuffer.length; i++) {
            sandData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sandBuffer.length * 0.3));
          }

          sandNoiseBuffer.buffer = sandBuffer;

          const sandGain = ctx.createGain();
          const sandFilter = ctx.createBiquadFilter();

          // Slightly rougher than stone, but still natural
          sandFilter.type = 'lowpass';
          sandFilter.frequency.value = 500; // Less warm than stone (600)
          sandFilter.Q.value = 1;

          sandNoiseBuffer.connect(sandFilter);
          sandFilter.connect(sandGain);
          sandGain.connect(ctx.destination);

          sandGain.gain.setValueAtTime(0.08 * this.masterVolume, now); // Slightly louder than stone (0.07)
          sandGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

          sandNoiseBuffer.start(now);
          break;

        case 'rustle':
          // Forest rustling - subtle white noise with gentle texture, louder than tatami
          const rustleNoiseBuffer = ctx.createBufferSource();
          const rustleBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
          const rustleData = rustleBuffer.getChannelData(0);

          // Generate pure white noise with gentle decay - no harsh frequencies
          for (let i = 0; i < rustleBuffer.length; i++) {
            rustleData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (rustleBuffer.length * 0.4));
          }

          rustleNoiseBuffer.buffer = rustleBuffer;

          const rustleGain = ctx.createGain();
          const rustleFilter = ctx.createBiquadFilter();

          // Gentle highpass to remove low rumble, keep it airy like leaves
          rustleFilter.type = 'highpass';
          rustleFilter.frequency.value = 300; // Remove low frequencies
          rustleFilter.Q.value = 0.5; // Gentle slope

          rustleNoiseBuffer.connect(rustleFilter);
          rustleFilter.connect(rustleGain);
          rustleGain.connect(ctx.destination);

          rustleGain.gain.setValueAtTime(0.07 * this.masterVolume, now); // Louder than tatami (0.042) but subtler than before
          rustleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

          rustleNoiseBuffer.start(now);
          break;

        case 'bell':
          // Subtle merchant bell - much quieter version of the merchant bell sound
          const bells = [
            { freq: 2637, time: 0 },      // E7
            { freq: 3136, time: 0.05 },   // G7 - faster timing for footstep
          ];

          bells.forEach(({ freq, time }) => {
            const osc = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const bellGain = ctx.createGain();

            osc.connect(bellGain);
            osc2.connect(bellGain);
            bellGain.connect(ctx.destination);

            osc.frequency.value = freq;
            osc2.frequency.value = freq * 2.01; // Slight detune for bell shimmer
            osc.type = 'sine';
            osc2.type = 'sine';

            const startTime = now + time;
            bellGain.gain.setValueAtTime(0.025 * this.masterVolume, startTime); // Much quieter than merchant bell (0.2)
            bellGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3); // Shorter duration for footstep

            osc.start(startTime);
            osc.stop(startTime + 0.3);
            osc2.start(startTime);
            osc2.stop(startTime + 0.3);
          });
          break;
      }
      
    } catch (error) {
      console.error('Error playing footstep sound:', error);
    }
  }

  /**
   * ANIMALS - Additional animal sounds for game creatures
   */
  public playTigerSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Deep growl/roar
      const growl = ctx.createOscillator();
      const growlGain = ctx.createGain();
      const growlFilter = ctx.createBiquadFilter();
      
      growl.connect(growlFilter);
      growlFilter.connect(growlGain);
      growlGain.connect(ctx.destination);
      
      growl.type = 'sawtooth';
      growl.frequency.value = 60;
      growl.frequency.linearRampToValueAtTime(80, now + 0.5);
      growl.frequency.exponentialRampToValueAtTime(50, now + 1);
      
      growlFilter.type = 'lowpass';
      growlFilter.frequency.value = 400;
      growlFilter.Q.value = 3;
      
      // Roar envelope
      growlGain.gain.setValueAtTime(0, now);
      growlGain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + 0.1);
      growlGain.gain.setValueAtTime(0.25 * this.masterVolume, now + 0.4);
      growlGain.gain.exponentialRampToValueAtTime(0.01, now + 1);
      
      growl.start(now);
      growl.stop(now + 1);
      
      // Add some noise for texture
      const noise = this.createWhiteNoise(ctx);
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 200;
      noiseFilter.Q.value = 5;
      
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, now + 0.1);
      noiseGain.gain.setValueAtTime(0.08 * this.masterVolume, now + 0.3);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      noise.start(now);
      noise.stop(now + 0.8);
      
    } catch (error) {
      console.error('Error playing tiger sound:', error);
    }
  }

  public playCrocodileSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Deep hiss/growl
      const hiss = this.createWhiteNoise(ctx);
      const hissGain = ctx.createGain();
      const hissFilter = ctx.createBiquadFilter();
      
      hiss.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(ctx.destination);
      
      hissFilter.type = 'bandpass';
      hissFilter.frequency.value = 400;
      hissFilter.Q.value = 10;
      
      hissGain.gain.setValueAtTime(0, now);
      hissGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.05);
      hissGain.gain.setValueAtTime(0.15 * this.masterVolume, now + 0.3);
      hissGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      hiss.start(now);
      hiss.stop(now + 0.5);
      
      // Deep rumble
      const rumble = ctx.createOscillator();
      const rumbleGain = ctx.createGain();
      
      rumble.connect(rumbleGain);
      rumbleGain.connect(ctx.destination);
      
      rumble.type = 'sawtooth';
      rumble.frequency.value = 40;
      
      rumbleGain.gain.setValueAtTime(0, now + 0.1);
      rumbleGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.15);
      rumbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      rumble.start(now + 0.1);
      rumble.stop(now + 0.4);
      
    } catch (error) {
      console.error('Error playing crocodile sound:', error);
    }
  }

  public playEagleSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Piercing screech
      const screech = ctx.createOscillator();
      const screechGain = ctx.createGain();
      const screechFilter = ctx.createBiquadFilter();
      
      screech.connect(screechFilter);
      screechFilter.connect(screechGain);
      screechGain.connect(ctx.destination);
      
      screech.type = 'sawtooth';
      screech.frequency.value = 2200;
      screech.frequency.linearRampToValueAtTime(2800, now + 0.2);
      screech.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
      
      screechFilter.type = 'bandpass';
      screechFilter.frequency.value = 2500;
      screechFilter.Q.value = 5;
      
      screechGain.gain.setValueAtTime(0, now);
      screechGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 0.05);
      screechGain.gain.setValueAtTime(0.12 * this.masterVolume, now + 0.2);
      screechGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      screech.start(now);
      screech.stop(now + 0.5);
      
    } catch (error) {
      console.error('Error playing eagle sound:', error);
    }
  }

  public playBearSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Deep growl/roar
      const growl = ctx.createOscillator();
      const growlGain = ctx.createGain();
      const growlFilter = ctx.createBiquadFilter();
      
      growl.connect(growlFilter);
      growlFilter.connect(growlGain);
      growlGain.connect(ctx.destination);
      
      growl.type = 'sawtooth';
      growl.frequency.value = 50;
      growl.frequency.linearRampToValueAtTime(70, now + 0.3);
      growl.frequency.exponentialRampToValueAtTime(45, now + 0.8);
      
      growlFilter.type = 'lowpass';
      growlFilter.frequency.value = 300;
      growlFilter.Q.value = 4;
      
      growlGain.gain.setValueAtTime(0, now);
      growlGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.1);
      growlGain.gain.setValueAtTime(0.3 * this.masterVolume, now + 0.4);
      growlGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      growl.start(now);
      growl.stop(now + 0.8);
      
    } catch (error) {
      console.error('Error playing bear sound:', error);
    }
  }

  public playElephantSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Elephant trumpet/rumble
      const trumpet = ctx.createOscillator();
      const trumpetGain = ctx.createGain();
      const trumpetFilter = ctx.createBiquadFilter();

      trumpet.connect(trumpetFilter);
      trumpetFilter.connect(trumpetGain);
      trumpetGain.connect(ctx.destination);

      trumpet.type = 'sawtooth';
      trumpet.frequency.value = 80;
      trumpet.frequency.linearRampToValueAtTime(200, now + 0.2);
      trumpet.frequency.linearRampToValueAtTime(150, now + 0.5);
      trumpet.frequency.exponentialRampToValueAtTime(60, now + 1.2);

      trumpetFilter.type = 'lowpass';
      trumpetFilter.frequency.value = 400;
      trumpetFilter.Q.value = 3;

      trumpetGain.gain.setValueAtTime(0, now);
      trumpetGain.gain.linearRampToValueAtTime(0.4 * this.masterVolume, now + 0.1);
      trumpetGain.gain.setValueAtTime(0.4 * this.masterVolume, now + 0.6);
      trumpetGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      trumpet.start(now);
      trumpet.stop(now + 1.2);

    } catch (error) {
      console.error('Error playing elephant sound:', error);
    }
  }

  public playRhinocerosSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Rhino snort/grunt
      const snort = ctx.createOscillator();
      const snortGain = ctx.createGain();
      const snortFilter = ctx.createBiquadFilter();

      snort.connect(snortFilter);
      snortFilter.connect(snortGain);
      snortGain.connect(ctx.destination);

      snort.type = 'sawtooth';
      snort.frequency.value = 150;
      snort.frequency.linearRampToValueAtTime(120, now + 0.15);
      snort.frequency.linearRampToValueAtTime(180, now + 0.25);
      snort.frequency.exponentialRampToValueAtTime(100, now + 0.4);

      snortFilter.type = 'lowpass';
      snortFilter.frequency.value = 600;
      snortFilter.Q.value = 2;

      snortGain.gain.setValueAtTime(0, now);
      snortGain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + 0.05);
      snortGain.gain.setValueAtTime(0.25 * this.masterVolume, now + 0.2);
      snortGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      snort.start(now);
      snort.stop(now + 0.4);

    } catch (error) {
      console.error('Error playing rhinoceros sound:', error);
    }
  }

  public playHippopotamusSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Hippo grunt/bellow
      const bellow = ctx.createOscillator();
      const bellowGain = ctx.createGain();
      const bellowFilter = ctx.createBiquadFilter();

      bellow.connect(bellowFilter);
      bellowFilter.connect(bellowGain);
      bellowGain.connect(ctx.destination);

      bellow.type = 'sawtooth';
      bellow.frequency.value = 40;
      bellow.frequency.linearRampToValueAtTime(80, now + 0.3);
      bellow.frequency.exponentialRampToValueAtTime(35, now + 0.8);

      bellowFilter.type = 'lowpass';
      bellowFilter.frequency.value = 200;
      bellowFilter.Q.value = 4;

      bellowGain.gain.setValueAtTime(0, now);
      bellowGain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + 0.1);
      bellowGain.gain.setValueAtTime(0.35 * this.masterVolume, now + 0.5);
      bellowGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      bellow.start(now);
      bellow.stop(now + 0.8);

    } catch (error) {
      console.error('Error playing hippopotamus sound:', error);
    }
  }

  public playGiraffeSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Giraffe hum/bleat (giraffes are actually quite quiet)
      const hum = ctx.createOscillator();
      const humGain = ctx.createGain();
      const humFilter = ctx.createBiquadFilter();

      hum.connect(humFilter);
      humFilter.connect(humGain);
      humGain.connect(ctx.destination);

      hum.type = 'sine';
      hum.frequency.value = 200;
      hum.frequency.linearRampToValueAtTime(250, now + 0.2);
      hum.frequency.exponentialRampToValueAtTime(180, now + 0.5);

      humFilter.type = 'bandpass';
      humFilter.frequency.value = 220;
      humFilter.Q.value = 8;

      humGain.gain.setValueAtTime(0, now);
      humGain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, now + 0.1);
      humGain.gain.setValueAtTime(0.08 * this.masterVolume, now + 0.3);
      humGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      hum.start(now);
      hum.stop(now + 0.5);

    } catch (error) {
      console.error('Error playing giraffe sound:', error);
    }
  }

  public playZebraSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Zebra whinny/bark
      const whinny = ctx.createOscillator();
      const whinnyGain = ctx.createGain();
      const whinnyFilter = ctx.createBiquadFilter();

      whinny.connect(whinnyFilter);
      whinnyFilter.connect(whinnyGain);
      whinnyGain.connect(ctx.destination);

      whinny.type = 'sawtooth';
      whinny.frequency.value = 400;
      whinny.frequency.linearRampToValueAtTime(600, now + 0.1);
      whinny.frequency.linearRampToValueAtTime(300, now + 0.3);
      whinny.frequency.linearRampToValueAtTime(500, now + 0.5);
      whinny.frequency.exponentialRampToValueAtTime(250, now + 0.8);

      whinnyFilter.type = 'bandpass';
      whinnyFilter.frequency.value = 450;
      whinnyFilter.Q.value = 3;

      whinnyGain.gain.setValueAtTime(0, now);
      whinnyGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.05);
      whinnyGain.gain.setValueAtTime(0.15 * this.masterVolume, now + 0.4);
      whinnyGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      whinny.start(now);
      whinny.stop(now + 0.8);

    } catch (error) {
      console.error('Error playing zebra sound:', error);
    }
  }

  public playLionSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Lion roar
      const roar = ctx.createOscillator();
      const roarGain = ctx.createGain();
      const roarFilter = ctx.createBiquadFilter();

      roar.connect(roarFilter);
      roarFilter.connect(roarGain);
      roarGain.connect(ctx.destination);

      roar.type = 'sawtooth';
      roar.frequency.value = 60;
      roar.frequency.linearRampToValueAtTime(120, now + 0.4);
      roar.frequency.linearRampToValueAtTime(80, now + 1.0);
      roar.frequency.exponentialRampToValueAtTime(45, now + 1.8);

      roarFilter.type = 'lowpass';
      roarFilter.frequency.value = 500;
      roarFilter.Q.value = 3;

      roarGain.gain.setValueAtTime(0, now);
      roarGain.gain.linearRampToValueAtTime(0.5 * this.masterVolume, now + 0.2);
      roarGain.gain.setValueAtTime(0.5 * this.masterVolume, now + 1.0);
      roarGain.gain.exponentialRampToValueAtTime(0.01, now + 1.8);

      roar.start(now);
      roar.stop(now + 1.8);

    } catch (error) {
      console.error('Error playing lion sound:', error);
    }
  }

  public playTigerSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Tiger chuff/roar
      const roar = ctx.createOscillator();
      const roarGain = ctx.createGain();
      const roarFilter = ctx.createBiquadFilter();

      roar.connect(roarFilter);
      roarFilter.connect(roarGain);
      roarGain.connect(ctx.destination);

      roar.type = 'sawtooth';
      roar.frequency.value = 70;
      roar.frequency.linearRampToValueAtTime(140, now + 0.3);
      roar.frequency.linearRampToValueAtTime(100, now + 0.8);
      roar.frequency.exponentialRampToValueAtTime(50, now + 1.5);

      roarFilter.type = 'lowpass';
      roarFilter.frequency.value = 600;
      roarFilter.Q.value = 2;

      roarGain.gain.setValueAtTime(0, now);
      roarGain.gain.linearRampToValueAtTime(0.45 * this.masterVolume, now + 0.15);
      roarGain.gain.setValueAtTime(0.45 * this.masterVolume, now + 0.6);
      roarGain.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

      roar.start(now);
      roar.stop(now + 1.5);

    } catch (error) {
      console.error('Error playing tiger sound:', error);
    }
  }

  public playLeopardSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Leopard cough/grunt
      const cough = ctx.createOscillator();
      const coughGain = ctx.createGain();
      const coughFilter = ctx.createBiquadFilter();

      cough.connect(coughFilter);
      coughFilter.connect(coughGain);
      coughGain.connect(ctx.destination);

      cough.type = 'sawtooth';
      cough.frequency.value = 120;
      cough.frequency.linearRampToValueAtTime(80, now + 0.1);
      cough.frequency.linearRampToValueAtTime(150, now + 0.2);
      cough.frequency.exponentialRampToValueAtTime(90, now + 0.4);

      coughFilter.type = 'lowpass';
      coughFilter.frequency.value = 400;
      coughFilter.Q.value = 4;

      coughGain.gain.setValueAtTime(0, now);
      coughGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.05);
      coughGain.gain.setValueAtTime(0.2 * this.masterVolume, now + 0.15);
      coughGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      cough.start(now);
      cough.stop(now + 0.4);

    } catch (error) {
      console.error('Error playing leopard sound:', error);
    }
  }

  public playCheetahSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Cheetah chirp/purr
      const chirp = ctx.createOscillator();
      const chirpGain = ctx.createGain();
      const chirpFilter = ctx.createBiquadFilter();

      chirp.connect(chirpFilter);
      chirpFilter.connect(chirpGain);
      chirpGain.connect(ctx.destination);

      chirp.type = 'sine';
      chirp.frequency.value = 400;
      chirp.frequency.linearRampToValueAtTime(600, now + 0.1);
      chirp.frequency.linearRampToValueAtTime(350, now + 0.3);
      chirp.frequency.exponentialRampToValueAtTime(500, now + 0.6);

      chirpFilter.type = 'bandpass';
      chirpFilter.frequency.value = 450;
      chirpFilter.Q.value = 6;

      chirpGain.gain.setValueAtTime(0, now);
      chirpGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 0.05);
      chirpGain.gain.setValueAtTime(0.12 * this.masterVolume, now + 0.3);
      chirpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      chirp.start(now);
      chirp.stop(now + 0.6);

    } catch (error) {
      console.error('Error playing cheetah sound:', error);
    }
  }

  public playHyenaSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Hyena laugh/cackle
      const laugh = ctx.createOscillator();
      const laughGain = ctx.createGain();
      const laughFilter = ctx.createBiquadFilter();

      laugh.connect(laughFilter);
      laughFilter.connect(laughGain);
      laughGain.connect(ctx.destination);

      laugh.type = 'sawtooth';
      laugh.frequency.value = 300;

      // Create cackling pattern
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          laugh.frequency.exponentialRampToValueAtTime(500 + Math.random() * 200, now + (i * 0.15) + 0.05);
          laugh.frequency.exponentialRampToValueAtTime(200 + Math.random() * 100, now + (i * 0.15) + 0.1);
        }, i * 150);
      }

      laughFilter.type = 'bandpass';
      laughFilter.frequency.value = 400;
      laughFilter.Q.value = 3;

      laughGain.gain.setValueAtTime(0, now);
      laughGain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, now + 0.05);
      laughGain.gain.setValueAtTime(0.18 * this.masterVolume, now + 0.8);
      laughGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      laugh.start(now);
      laugh.stop(now + 1.2);

    } catch (error) {
      console.error('Error playing hyena sound:', error);
    }
  }

  public playGorillaSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Gorilla chest beating and grunts
      const grunt = ctx.createOscillator();
      const gruntGain = ctx.createGain();
      const gruntFilter = ctx.createBiquadFilter();

      grunt.connect(gruntFilter);
      gruntFilter.connect(gruntGain);
      gruntGain.connect(ctx.destination);

      grunt.type = 'sawtooth';
      grunt.frequency.value = 35;
      grunt.frequency.linearRampToValueAtTime(60, now + 0.2);
      grunt.frequency.exponentialRampToValueAtTime(30, now + 0.6);

      gruntFilter.type = 'lowpass';
      gruntFilter.frequency.value = 150;
      gruntFilter.Q.value = 5;

      gruntGain.gain.setValueAtTime(0, now);
      gruntGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.1);
      gruntGain.gain.setValueAtTime(0.3 * this.masterVolume, now + 0.4);
      gruntGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

      grunt.start(now);
      grunt.stop(now + 0.6);

    } catch (error) {
      console.error('Error playing gorilla sound:', error);
    }
  }

  public playMonkeySound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Monkey chatter/screech
      const chatter = ctx.createOscillator();
      const chatterGain = ctx.createGain();
      const chatterFilter = ctx.createBiquadFilter();

      chatter.connect(chatterFilter);
      chatterFilter.connect(chatterGain);
      chatterGain.connect(ctx.destination);

      chatter.type = 'sawtooth';
      chatter.frequency.value = 800;
      chatter.frequency.linearRampToValueAtTime(1200, now + 0.1);
      chatter.frequency.linearRampToValueAtTime(600, now + 0.2);
      chatter.frequency.linearRampToValueAtTime(1000, now + 0.4);

      chatterFilter.type = 'bandpass';
      chatterFilter.frequency.value = 900;
      chatterFilter.Q.value = 4;

      chatterGain.gain.setValueAtTime(0, now);
      chatterGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.02);
      chatterGain.gain.setValueAtTime(0.15 * this.masterVolume, now + 0.2);
      chatterGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      chatter.start(now);
      chatter.stop(now + 0.4);

    } catch (error) {
      console.error('Error playing monkey sound:', error);
    }
  }

  public playCowSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Cow moo
      const moo = ctx.createOscillator();
      const mooGain = ctx.createGain();
      const mooFilter = ctx.createBiquadFilter();

      moo.connect(mooFilter);
      mooFilter.connect(mooGain);
      mooGain.connect(ctx.destination);

      moo.type = 'sawtooth';
      moo.frequency.value = 100;
      moo.frequency.linearRampToValueAtTime(150, now + 0.3);
      moo.frequency.linearRampToValueAtTime(120, now + 0.8);
      moo.frequency.exponentialRampToValueAtTime(80, now + 1.2);

      mooFilter.type = 'lowpass';
      mooFilter.frequency.value = 300;
      mooFilter.Q.value = 3;

      mooGain.gain.setValueAtTime(0, now);
      mooGain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + 0.1);
      mooGain.gain.setValueAtTime(0.25 * this.masterVolume, now + 0.8);
      mooGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      moo.start(now);
      moo.stop(now + 1.2);

    } catch (error) {
      console.error('Error playing cow sound:', error);
    }
  }

  public playPigSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Pig oink/snort
      const oink = ctx.createOscillator();
      const oinkGain = ctx.createGain();
      const oinkFilter = ctx.createBiquadFilter();

      oink.connect(oinkFilter);
      oinkFilter.connect(oinkGain);
      oinkGain.connect(ctx.destination);

      oink.type = 'sawtooth';
      oink.frequency.value = 200;
      oink.frequency.linearRampToValueAtTime(300, now + 0.1);
      oink.frequency.exponentialRampToValueAtTime(150, now + 0.3);

      oinkFilter.type = 'lowpass';
      oinkFilter.frequency.value = 800;
      oinkFilter.Q.value = 2;

      oinkGain.gain.setValueAtTime(0, now);
      oinkGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.05);
      oinkGain.gain.setValueAtTime(0.2 * this.masterVolume, now + 0.15);
      oinkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      oink.start(now);
      oink.stop(now + 0.3);

    } catch (error) {
      console.error('Error playing pig sound:', error);
    }
  }

  public playHorseSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Horse neigh/whinny
      const neigh = ctx.createOscillator();
      const neighGain = ctx.createGain();
      const neighFilter = ctx.createBiquadFilter();

      neigh.connect(neighFilter);
      neighFilter.connect(neighGain);
      neighGain.connect(ctx.destination);

      neigh.type = 'sawtooth';
      neigh.frequency.value = 500;
      neigh.frequency.linearRampToValueAtTime(800, now + 0.2);
      neigh.frequency.linearRampToValueAtTime(400, now + 0.5);
      neigh.frequency.linearRampToValueAtTime(600, now + 0.8);
      neigh.frequency.exponentialRampToValueAtTime(300, now + 1.2);

      neighFilter.type = 'bandpass';
      neighFilter.frequency.value = 600;
      neighFilter.Q.value = 3;

      neighGain.gain.setValueAtTime(0, now);
      neighGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.1);
      neighGain.gain.setValueAtTime(0.3 * this.masterVolume, now + 0.8);
      neighGain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);

      neigh.start(now);
      neigh.stop(now + 1.2);

    } catch (error) {
      console.error('Error playing horse sound:', error);
    }
  }

  public playWhaleSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Whale song
      const song = ctx.createOscillator();
      const songGain = ctx.createGain();
      const songFilter = ctx.createBiquadFilter();

      song.connect(songFilter);
      songFilter.connect(songGain);
      songGain.connect(ctx.destination);

      song.type = 'sine';
      song.frequency.value = 200;
      song.frequency.exponentialRampToValueAtTime(80, now + 1.0);
      song.frequency.exponentialRampToValueAtTime(300, now + 2.0);
      song.frequency.exponentialRampToValueAtTime(150, now + 3.5);

      songFilter.type = 'lowpass';
      songFilter.frequency.value = 400;
      songFilter.Q.value = 2;

      songGain.gain.setValueAtTime(0, now);
      songGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.3);
      songGain.gain.setValueAtTime(0.2 * this.masterVolume, now + 2.5);
      songGain.gain.exponentialRampToValueAtTime(0.01, now + 3.5);

      song.start(now);
      song.stop(now + 3.5);

    } catch (error) {
      console.error('Error playing whale sound:', error);
    }
  }

  public playBisonSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Bison grunt/bellow
      const grunt = ctx.createOscillator();
      const gruntGain = ctx.createGain();
      const gruntFilter = ctx.createBiquadFilter();

      grunt.connect(gruntFilter);
      gruntFilter.connect(gruntGain);
      gruntGain.connect(ctx.destination);

      grunt.type = 'sawtooth';
      grunt.frequency.value = 60;
      grunt.frequency.linearRampToValueAtTime(90, now + 0.4);
      grunt.frequency.exponentialRampToValueAtTime(45, now + 1.0);

      gruntFilter.type = 'lowpass';
      gruntFilter.frequency.value = 250;
      gruntFilter.Q.value = 4;

      gruntGain.gain.setValueAtTime(0, now);
      gruntGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.15);
      gruntGain.gain.setValueAtTime(0.3 * this.masterVolume, now + 0.6);
      gruntGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

      grunt.start(now);
      grunt.stop(now + 1.0);

    } catch (error) {
      console.error('Error playing bison sound:', error);
    }
  }

  public playDuckSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Duck quack
      const quack = ctx.createOscillator();
      const quackGain = ctx.createGain();
      const quackFilter = ctx.createBiquadFilter();

      quack.connect(quackFilter);
      quackFilter.connect(quackGain);
      quackGain.connect(ctx.destination);

      quack.type = 'sawtooth';
      quack.frequency.value = 400;
      quack.frequency.linearRampToValueAtTime(300, now + 0.1);
      quack.frequency.exponentialRampToValueAtTime(450, now + 0.2);

      quackFilter.type = 'bandpass';
      quackFilter.frequency.value = 350;
      quackFilter.Q.value = 3;

      quackGain.gain.setValueAtTime(0, now);
      quackGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.02);
      quackGain.gain.setValueAtTime(0.15 * this.masterVolume, now + 0.1);
      quackGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      quack.start(now);
      quack.stop(now + 0.2);

    } catch (error) {
      console.error('Error playing duck sound:', error);
    }
  }

  public playRabbitSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Rabbit thump/squeak (rabbits are mostly quiet)
      const squeak = ctx.createOscillator();
      const squeakGain = ctx.createGain();
      const squeakFilter = ctx.createBiquadFilter();

      squeak.connect(squeakFilter);
      squeakFilter.connect(squeakGain);
      squeakGain.connect(ctx.destination);

      squeak.type = 'sine';
      squeak.frequency.value = 800;
      squeak.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

      squeakFilter.type = 'bandpass';
      squeakFilter.frequency.value = 1000;
      squeakFilter.Q.value = 8;

      squeakGain.gain.setValueAtTime(0, now);
      squeakGain.gain.linearRampToValueAtTime(0.05 * this.masterVolume, now + 0.01);
      squeakGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      squeak.start(now);
      squeak.stop(now + 0.05);

    } catch (error) {
      console.error('Error playing rabbit sound:', error);
    }
  }

  public playCrocodileSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Crocodile hiss/bellow
      const hiss = ctx.createOscillator();
      const hissGain = ctx.createGain();
      const hissFilter = ctx.createBiquadFilter();

      hiss.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(ctx.destination);

      hiss.type = 'sawtooth';
      hiss.frequency.value = 40;
      hiss.frequency.linearRampToValueAtTime(70, now + 0.3);
      hiss.frequency.exponentialRampToValueAtTime(35, now + 0.8);

      hissFilter.type = 'lowpass';
      hissFilter.frequency.value = 200;
      hissFilter.Q.value = 3;

      hissGain.gain.setValueAtTime(0, now);
      hissGain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + 0.1);
      hissGain.gain.setValueAtTime(0.25 * this.masterVolume, now + 0.5);
      hissGain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      hiss.start(now);
      hiss.stop(now + 0.8);

    } catch (error) {
      console.error('Error playing crocodile sound:', error);
    }
  }

  public playSnakeSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Hissing sound
      const hiss = this.createWhiteNoise(ctx);
      const hissGain = ctx.createGain();
      const hissFilter = ctx.createBiquadFilter();
      
      hiss.connect(hissFilter);
      hissFilter.connect(hissGain);
      hissGain.connect(ctx.destination);
      
      hissFilter.type = 'highpass';
      hissFilter.frequency.value = 3000;
      hissFilter.Q.value = 2;
      
      // Hiss envelope with slight modulation
      hissGain.gain.setValueAtTime(0, now);
      hissGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 0.05);
      hissGain.gain.setValueAtTime(0.12 * this.masterVolume, now + 0.3);
      hissGain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, now + 0.4);
      hissGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 0.5);
      hissGain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      
      hiss.start(now);
      hiss.stop(now + 0.7);
      
    } catch (error) {
      console.error('Error playing snake sound:', error);
    }
  }

  // =============================================================================
  // COMBAT SOUND EFFECTS
  // =============================================================================

  public playCombatAttackSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Swoosh/swing sound
      const swoosh = this.createWhiteNoise(ctx);
      const swooshGain = ctx.createGain();
      const swooshFilter = ctx.createBiquadFilter();

      swoosh.connect(swooshFilter);
      swooshFilter.connect(swooshGain);
      swooshGain.connect(ctx.destination);

      swooshFilter.type = 'bandpass';
      swooshFilter.frequency.value = 1200;
      swooshFilter.Q.value = 8;

      swooshGain.gain.setValueAtTime(0, now);
      swooshGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.02);
      swooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      swoosh.start(now);
      swoosh.stop(now + 0.25);

    } catch (error) {
      console.error('Error playing combat attack sound:', error);
    }
  }

  public playCombatHitSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Impact thud
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      const thudFilter = ctx.createBiquadFilter();

      thud.connect(thudFilter);
      thudFilter.connect(thudGain);
      thudGain.connect(ctx.destination);

      thud.type = 'square';
      thud.frequency.value = 80;
      thud.frequency.exponentialRampToValueAtTime(40, now + 0.1);

      thudFilter.type = 'lowpass';
      thudFilter.frequency.value = 300;
      thudFilter.Q.value = 2;

      thudGain.gain.setValueAtTime(0, now);
      thudGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.01);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      thud.start(now);
      thud.stop(now + 0.15);

    } catch (error) {
      console.error('Error playing combat hit sound:', error);
    }
  }

  public playCombatCriticalHitSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Heavy impact with metallic ring
      const impact = ctx.createOscillator();
      const impactGain = ctx.createGain();
      const impactFilter = ctx.createBiquadFilter();

      impact.connect(impactFilter);
      impactFilter.connect(impactGain);
      impactGain.connect(ctx.destination);

      impact.type = 'sawtooth';
      impact.frequency.value = 200;
      impact.frequency.exponentialRampToValueAtTime(50, now + 0.1);

      impactFilter.type = 'lowpass';
      impactFilter.frequency.value = 800;
      impactFilter.Q.value = 3;

      impactGain.gain.setValueAtTime(0, now);
      impactGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, now + 0.02);
      impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      impact.start(now);
      impact.stop(now + 0.3);

      // Add metallic ring
      setTimeout(() => {
        const ring = ctx.createOscillator();
        const ringGain = ctx.createGain();

        ring.connect(ringGain);
        ringGain.connect(ctx.destination);

        ring.type = 'sine';
        ring.frequency.value = 1500;
        ring.frequency.exponentialRampToValueAtTime(800, now + 0.5);

        ringGain.gain.setValueAtTime(0, now + 0.1);
        ringGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, now + 0.15);
        ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        ring.start(now + 0.1);
        ring.stop(now + 0.5);
      }, 50);

    } catch (error) {
      console.error('Error playing combat critical hit sound:', error);
    }
  }

  public playCombatMissSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Whoosh miss
      const whoosh = this.createWhiteNoise(ctx);
      const whooshGain = ctx.createGain();
      const whooshFilter = ctx.createBiquadFilter();

      whoosh.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(ctx.destination);

      whooshFilter.type = 'highpass';
      whooshFilter.frequency.value = 2000;
      whooshFilter.Q.value = 2;

      whooshGain.gain.setValueAtTime(0, now);
      whooshGain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, now + 0.05);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      whoosh.start(now);
      whoosh.stop(now + 0.2);

    } catch (error) {
      console.error('Error playing combat miss sound:', error);
    }
  }

  public playCombatBlockSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Shield block clang
      const clang = ctx.createOscillator();
      const clangGain = ctx.createGain();
      const clangFilter = ctx.createBiquadFilter();

      clang.connect(clangFilter);
      clangFilter.connect(clangGain);
      clangGain.connect(ctx.destination);

      clang.type = 'triangle';
      clang.frequency.value = 800;
      clang.frequency.exponentialRampToValueAtTime(400, now + 0.1);

      clangFilter.type = 'bandpass';
      clangFilter.frequency.value = 600;
      clangFilter.Q.value = 5;

      clangGain.gain.setValueAtTime(0, now);
      clangGain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, now + 0.01);
      clangGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      clang.start(now);
      clang.stop(now + 0.2);

    } catch (error) {
      console.error('Error playing combat block sound:', error);
    }
  }

  public playCombatFleeSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Quick footsteps
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          const step = this.createWhiteNoise(ctx);
          const stepGain = ctx.createGain();
          const stepFilter = ctx.createBiquadFilter();

          step.connect(stepFilter);
          stepFilter.connect(stepGain);
          stepGain.connect(ctx.destination);

          stepFilter.type = 'lowpass';
          stepFilter.frequency.value = 400;
          stepFilter.Q.value = 2;

          stepGain.gain.setValueAtTime(0, ctx.currentTime);
          stepGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, ctx.currentTime + 0.02);
          stepGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

          step.start(ctx.currentTime);
          step.stop(ctx.currentTime + 0.08);
        }, i * 80);
      }

    } catch (error) {
      console.error('Error playing combat flee sound:', error);
    }
  }

  public playCombatThrowSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Throwing whoosh
      const whoosh = this.createWhiteNoise(ctx);
      const whooshGain = ctx.createGain();
      const whooshFilter = ctx.createBiquadFilter();

      whoosh.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(ctx.destination);

      whooshFilter.type = 'bandpass';
      whooshFilter.frequency.value = 800;
      whooshFilter.Q.value = 4;

      whooshGain.gain.setValueAtTime(0, now);
      whooshGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 0.1);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      whoosh.start(now);
      whoosh.stop(now + 0.4);

    } catch (error) {
      console.error('Error playing combat throw sound:', error);
    }
  }

  public playCombatVictorySound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Victory fanfare
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const note = ctx.createOscillator();
          const noteGain = ctx.createGain();

          note.connect(noteGain);
          noteGain.connect(ctx.destination);

          note.type = 'triangle';
          note.frequency.value = freq;

          noteGain.gain.setValueAtTime(0, ctx.currentTime);
          noteGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, ctx.currentTime + 0.05);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

          note.start(ctx.currentTime);
          note.stop(ctx.currentTime + 0.3);
        }, i * 150);
      });

    } catch (error) {
      console.error('Error playing combat victory sound:', error);
    }
  }

  public playCombatDefeatSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Defeat sound - descending notes
      const notes = [392, 330, 262, 196]; // G4, E4, C4, G3
      notes.forEach((freq, i) => {
        setTimeout(() => {
          const note = ctx.createOscillator();
          const noteGain = ctx.createGain();
          const noteFilter = ctx.createBiquadFilter();

          note.connect(noteFilter);
          noteFilter.connect(noteGain);
          noteGain.connect(ctx.destination);

          note.type = 'sine';
          note.frequency.value = freq;

          noteFilter.type = 'lowpass';
          noteFilter.frequency.value = freq * 2;
          noteFilter.Q.value = 2;

          noteGain.gain.setValueAtTime(0, ctx.currentTime);
          noteGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, ctx.currentTime + 0.1);
          noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

          note.start(ctx.currentTime);
          note.stop(ctx.currentTime + 0.8);
        }, i * 200);
      });

    } catch (error) {
      console.error('Error playing combat defeat sound:', error);
    }
  }

  public playCombatPowerAttackSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Power-up swoosh
      const swoosh = this.createWhiteNoise(ctx);
      const swooshGain = ctx.createGain();
      const swooshFilter = ctx.createBiquadFilter();

      swoosh.connect(swooshFilter);
      swooshFilter.connect(swooshGain);
      swooshGain.connect(ctx.destination);

      swooshFilter.type = 'bandpass';
      swooshFilter.frequency.setValueAtTime(400, now);
      swooshFilter.frequency.exponentialRampToValueAtTime(1600, now + 0.4);
      swooshFilter.Q.value = 6;

      swooshGain.gain.setValueAtTime(0, now);
      swooshGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.1);
      swooshGain.gain.setValueAtTime(0.2 * this.masterVolume, now + 0.3);
      swooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      swoosh.start(now);
      swoosh.stop(now + 0.5);

    } catch (error) {
      console.error('Error playing combat power attack sound:', error);
    }
  }

  public playCombatChopSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Heavy axe swing with impact
      const swing = this.createWhiteNoise(ctx);
      const swingGain = ctx.createGain();
      const swingFilter = ctx.createBiquadFilter();

      swing.connect(swingFilter);
      swingFilter.connect(swingGain);
      swingGain.connect(ctx.destination);

      swingFilter.type = 'bandpass';
      swingFilter.frequency.setValueAtTime(800, now);
      swingFilter.frequency.exponentialRampToValueAtTime(400, now + 0.3);
      swingFilter.Q.value = 4;

      swingGain.gain.setValueAtTime(0, now);
      swingGain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, now + 0.05);
      swingGain.gain.setValueAtTime(0.25 * this.masterVolume, now + 0.2);
      swingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      swing.start(now);
      swing.stop(now + 0.5);

      // Heavy impact thud
      setTimeout(() => {
        const impact = ctx.createOscillator();
        const impactGain = ctx.createGain();

        impact.connect(impactGain);
        impactGain.connect(ctx.destination);

        impact.type = 'square';
        impact.frequency.value = 60;
        impact.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.2);

        impactGain.gain.setValueAtTime(0, ctx.currentTime);
        impactGain.gain.linearRampToValueAtTime(0.3 * this.masterVolume, ctx.currentTime + 0.02);
        impactGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        impact.start(ctx.currentTime);
        impact.stop(ctx.currentTime + 0.3);
      }, 300);

    } catch (error) {
      console.error('Error playing combat chop sound:', error);
    }
  }

  public playCombatBurnSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Fire crackling
      const crackle = this.createWhiteNoise(ctx);
      const crackleGain = ctx.createGain();
      const crackleFilter = ctx.createBiquadFilter();

      crackle.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(ctx.destination);

      crackleFilter.type = 'highpass';
      crackleFilter.frequency.value = 2000;
      crackleFilter.Q.value = 3;

      // Crackling envelope with random modulation
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          crackleGain.gain.setValueAtTime(0, ctx.currentTime);
          crackleGain.gain.linearRampToValueAtTime((0.1 + Math.random() * 0.1) * this.masterVolume, ctx.currentTime + 0.02);
          crackleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        }, i * 80);
      }

      crackle.start(now);
      crackle.stop(now + 0.8);

    } catch (error) {
      console.error('Error playing combat burn sound:', error);
    }
  }

  public playCombatIntimidatingShoutSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Powerful battle cry
      const shout = ctx.createOscillator();
      const shoutGain = ctx.createGain();
      const shoutFilter = ctx.createBiquadFilter();

      shout.connect(shoutFilter);
      shoutFilter.connect(shoutGain);
      shoutGain.connect(ctx.destination);

      shout.type = 'sawtooth';
      shout.frequency.value = 150;
      shout.frequency.linearRampToValueAtTime(200, now + 0.2);
      shout.frequency.exponentialRampToValueAtTime(100, now + 0.8);

      shoutFilter.type = 'bandpass';
      shoutFilter.frequency.value = 400;
      shoutFilter.Q.value = 3;

      shoutGain.gain.setValueAtTime(0, now);
      shoutGain.gain.linearRampToValueAtTime(0.35 * this.masterVolume, now + 0.1);
      shoutGain.gain.setValueAtTime(0.35 * this.masterVolume, now + 0.5);
      shoutGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      shout.start(now);
      shout.stop(now + 0.8);

    } catch (error) {
      console.error('Error playing combat intimidating shout sound:', error);
    }
  }

  public playCombatThrustSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Sharp piercing sound
      const thrust = this.createWhiteNoise(ctx);
      const thrustGain = ctx.createGain();
      const thrustFilter = ctx.createBiquadFilter();

      thrust.connect(thrustFilter);
      thrustFilter.connect(thrustGain);
      thrustGain.connect(ctx.destination);

      thrustFilter.type = 'bandpass';
      thrustFilter.frequency.value = 1500;
      thrustFilter.Q.value = 8;

      thrustGain.gain.setValueAtTime(0, now);
      thrustGain.gain.linearRampToValueAtTime(0.18 * this.masterVolume, now + 0.01);
      thrustGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      thrust.start(now);
      thrust.stop(now + 0.15);

    } catch (error) {
      console.error('Error playing combat thrust sound:', error);
    }
  }

  public playBarkSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Dog bark
      const bark = ctx.createOscillator();
      const barkGain = ctx.createGain();
      const barkFilter = ctx.createBiquadFilter();

      bark.connect(barkFilter);
      barkFilter.connect(barkGain);
      barkGain.connect(ctx.destination);

      bark.type = 'sawtooth';
      bark.frequency.value = 300;
      bark.frequency.linearRampToValueAtTime(200, now + 0.1);
      bark.frequency.exponentialRampToValueAtTime(150, now + 0.2);

      barkFilter.type = 'bandpass';
      barkFilter.frequency.value = 250;
      barkFilter.Q.value = 3;

      barkGain.gain.setValueAtTime(0, now);
      barkGain.gain.linearRampToValueAtTime(0.2 * this.masterVolume, now + 0.02);
      barkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      bark.start(now);
      bark.stop(now + 0.2);

    } catch (error) {
      console.error('Error playing bark sound:', error);
    }
  }

  public playMeowSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Cat meow
      const meow = ctx.createOscillator();
      const meowGain = ctx.createGain();
      const meowFilter = ctx.createBiquadFilter();

      meow.connect(meowFilter);
      meowFilter.connect(meowGain);
      meowGain.connect(ctx.destination);

      meow.type = 'triangle';
      meow.frequency.value = 400;
      meow.frequency.linearRampToValueAtTime(600, now + 0.1);
      meow.frequency.exponentialRampToValueAtTime(300, now + 0.4);

      meowFilter.type = 'bandpass';
      meowFilter.frequency.value = 500;
      meowFilter.Q.value = 4;

      meowGain.gain.setValueAtTime(0, now);
      meowGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 0.05);
      meowGain.gain.setValueAtTime(0.12 * this.masterVolume, now + 0.2);
      meowGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      meow.start(now);
      meow.stop(now + 0.4);

    } catch (error) {
      console.error('Error playing meow sound:', error);
    }
  }

  public playFishSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Water splash/plop sound
      const splash = this.createWhiteNoise(ctx);
      const splashGain = ctx.createGain();
      const splashFilter = ctx.createBiquadFilter();
      
      splash.connect(splashFilter);
      splashFilter.connect(splashGain);
      splashGain.connect(ctx.destination);
      
      splashFilter.type = 'bandpass';
      splashFilter.frequency.value = 800;
      splashFilter.Q.value = 2;
      splashFilter.frequency.exponentialRampToValueAtTime(400, now + 0.1);
      
      splashGain.gain.setValueAtTime(0.08 * this.masterVolume, now);
      splashGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      splash.start(now);
      splash.stop(now + 0.15);
      
      // Bubble sound
      const bubble = ctx.createOscillator();
      const bubbleGain = ctx.createGain();
      
      bubble.connect(bubbleGain);
      bubbleGain.connect(ctx.destination);
      
      bubble.type = 'sine';
      bubble.frequency.value = 600;
      bubble.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      
      bubbleGain.gain.setValueAtTime(0.04 * this.masterVolume, now);
      bubbleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      
      bubble.start(now);
      bubble.stop(now + 0.05);
      
    } catch (error) {
      console.error('Error playing fish sound:', error);
    }
  }

  public playCamelSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Camel grunt/bellow
      const grunt = ctx.createOscillator();
      const gruntGain = ctx.createGain();
      const gruntFilter = ctx.createBiquadFilter();
      
      grunt.connect(gruntFilter);
      gruntFilter.connect(gruntGain);
      gruntGain.connect(ctx.destination);
      
      grunt.type = 'sawtooth';
      grunt.frequency.value = 120;
      grunt.frequency.linearRampToValueAtTime(100, now + 0.3);
      grunt.frequency.linearRampToValueAtTime(110, now + 0.6);
      
      gruntFilter.type = 'lowpass';
      gruntFilter.frequency.value = 500;
      gruntFilter.Q.value = 2;
      
      // Modulated grunt
      gruntGain.gain.setValueAtTime(0, now);
      gruntGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.1);
      gruntGain.gain.linearRampToValueAtTime(0.08 * this.masterVolume, now + 0.2);
      gruntGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.3);
      gruntGain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      
      grunt.start(now);
      grunt.stop(now + 0.6);
      
    } catch (error) {
      console.error('Error playing camel sound:', error);
    }
  }

  public playRabbitSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Soft squeak/thump
      const squeak = ctx.createOscillator();
      const squeakGain = ctx.createGain();
      
      squeak.connect(squeakGain);
      squeakGain.connect(ctx.destination);
      
      squeak.type = 'sine';
      squeak.frequency.value = 1800;
      squeak.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      
      squeakGain.gain.setValueAtTime(0.03 * this.masterVolume, now);
      squeakGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      
      squeak.start(now);
      squeak.stop(now + 0.05);
      
      // Soft thump (rabbit foot)
      const thump = ctx.createOscillator();
      const thumpGain = ctx.createGain();
      
      thump.connect(thumpGain);
      thumpGain.connect(ctx.destination);
      
      thump.type = 'sine';
      thump.frequency.value = 80;
      
      thumpGain.gain.setValueAtTime(0.04 * this.masterVolume, now + 0.03);
      thumpGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      
      thump.start(now + 0.03);
      thump.stop(now + 0.08);
      
    } catch (error) {
      console.error('Error playing rabbit sound:', error);
    }
  }

  /**
   * UI CLICK SOUND - Subtle click for modal buttons
   */
  public playUIClickSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Simple, clean click
      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();
      
      click.connect(clickGain);
      clickGain.connect(ctx.destination);
      
      click.type = 'sine';
      click.frequency.setValueAtTime(800, now);
      click.frequency.exponentialRampToValueAtTime(1200, now + 0.01);
      
      clickGain.gain.setValueAtTime(0.03 * this.masterVolume, now);
      clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
      
      click.start(now);
      click.stop(now + 0.02);
      
    } catch (error) {
      console.error('Error playing UI click sound:', error);
    }
  }

  /**
   * GENERIC MUSIC - Pleasant orchestral theme for inns/restaurants
   */
  private genericMusicNodes: AudioNode[] = [];
  private genericMusicPlaying = false;

  public playGenericMusic() {
    if (this.isMuted || this.genericMusicPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.genericMusicPlaying = true;
      this.genericMusicNodes = [];
      const now = ctx.currentTime;
      const duration = 30; // 30 seconds of music

      // Create master gain for the entire composition with fade-in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 5); // 5 second fade-in
      masterGain.connect(ctx.destination);
      this.genericMusicNodes.push(masterGain);

      // BASS LINE - Deep, driving foundation
      this.createBassLine(ctx, now, duration, masterGain);
      
      // DRUMS - Epic battle rhythm
      this.createDrumPattern(ctx, now, duration, masterGain);
      
      // BRASS SECTION - Heroic fanfares
      this.createBrassSection(ctx, now, duration, masterGain);
      
      // STRINGS - Sweeping orchestral strings
      this.createStringSection(ctx, now, duration, masterGain);
      
      // LEAD MELODY - Epic main theme
      this.createLeadMelody(ctx, now, duration, masterGain);

      // Stop after duration
      setTimeout(() => {
        this.stopGenericMusic();
      }, duration * 1000);

    } catch (error) {
      console.error('Error playing generic music:', error);
      this.genericMusicPlaying = false;
    }
  }

  private createBassLine(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.3, startTime);
    bassGain.connect(masterGain);

    // Bass sequence: C - F - G - C (classic progression)
    const bassNotes = [130.81, 174.61, 196.00, 130.81]; // C3, F3, G3, C3
    const noteLength = 1.0; // 1 second per note

    for (let i = 0; i < duration; i += noteLength) {
      const noteIndex = Math.floor(i / noteLength) % bassNotes.length;
      const bass = ctx.createOscillator();
      const noteGain = ctx.createGain();
      
      bass.connect(noteGain);
      noteGain.connect(bassGain);
      
      bass.type = 'sawtooth';
      bass.frequency.value = bassNotes[noteIndex];
      
      noteGain.gain.setValueAtTime(0.8, startTime + i);
      noteGain.gain.exponentialRampToValueAtTime(0.4, startTime + i + noteLength * 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + noteLength);
      
      bass.start(startTime + i);
      bass.stop(startTime + i + noteLength);
      this.genericMusicNodes.push(bass, noteGain);
    }
    
    this.genericMusicNodes.push(bassGain);
  }

  private createDrumPattern(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const drumGain = ctx.createGain();
    drumGain.gain.setValueAtTime(0.4, startTime);
    drumGain.connect(masterGain);

    const beatInterval = 0.5; // 120 BPM
    
    for (let i = 0; i < duration; i += beatInterval) {
      const beat = Math.floor(i / beatInterval) % 4;
      
      if (beat === 0 || beat === 2) {
        // Kick drum on 1 and 3
        this.createKickDrum(ctx, startTime + i, drumGain);
      }
      
      if (beat === 1 || beat === 3) {
        // Snare on 2 and 4
        this.createSnareDrum(ctx, startTime + i, drumGain);
      }
      
      // Hi-hat on every beat
      this.createHiHat(ctx, startTime + i, drumGain);
    }
    
    this.genericMusicNodes.push(drumGain);
  }

  private createKickDrum(ctx: AudioContext, time: number, drumGain: GainNode) {
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    
    kick.connect(kickGain);
    kickGain.connect(drumGain);
    
    kick.type = 'sine';
    kick.frequency.setValueAtTime(60, time);
    kick.frequency.exponentialRampToValueAtTime(30, time + 0.1);
    
    kickGain.gain.setValueAtTime(1.0, time);
    kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    kick.start(time);
    kick.stop(time + 0.1);
    this.genericMusicNodes.push(kick, kickGain);
  }

  private createSnareDrum(ctx: AudioContext, time: number, drumGain: GainNode) {
    const snare = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.2));
    }
    
    snare.buffer = buffer;
    
    const snareGain = ctx.createGain();
    const snareFilter = ctx.createBiquadFilter();
    
    snare.connect(snareFilter);
    snareFilter.connect(snareGain);
    snareGain.connect(drumGain);
    
    snareFilter.type = 'highpass';
    snareFilter.frequency.value = 200;
    
    snareGain.gain.setValueAtTime(0.6, time);
    snareGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    snare.start(time);
    this.genericMusicNodes.push(snare, snareGain, snareFilter);
  }

  private createHiHat(ctx: AudioContext, time: number, drumGain: GainNode) {
    const hihat = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.1));
    }
    
    hihat.buffer = buffer;
    
    const hihatGain = ctx.createGain();
    const hihatFilter = ctx.createBiquadFilter();
    
    hihat.connect(hihatFilter);
    hihatFilter.connect(hihatGain);
    hihatGain.connect(drumGain);
    
    hihatFilter.type = 'highpass';
    hihatFilter.frequency.value = 8000;
    
    hihatGain.gain.setValueAtTime(0.2, time);
    hihatGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    
    hihat.start(time);
    this.genericMusicNodes.push(hihat, hihatGain, hihatFilter);
  }

  private createBrassSection(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const brassGain = ctx.createGain();
    brassGain.gain.setValueAtTime(0.25, startTime);
    brassGain.connect(masterGain);

    // Heroic brass fanfare pattern
    const fanfareNotes = [523.25, 659.26, 783.99, 1046.50]; // C5, E5, G5, C6
    const fanfareInterval = 4.0; // Every 4 seconds
    
    for (let i = 0; i < duration; i += fanfareInterval) {
      for (let j = 0; j < fanfareNotes.length; j++) {
        const brass = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const noteTime = startTime + i + (j * 0.25);
        
        brass.connect(noteGain);
        noteGain.connect(brassGain);
        
        brass.type = 'sawtooth';
        brass.frequency.value = fanfareNotes[j];
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.8, noteTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.2, noteTime + 0.4);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.5);
        
        brass.start(noteTime);
        brass.stop(noteTime + 0.5);
        this.genericMusicNodes.push(brass, noteGain);
      }
    }
    
    this.genericMusicNodes.push(brassGain);
  }

  private createStringSection(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const stringsGain = ctx.createGain();
    stringsGain.gain.setValueAtTime(0.2, startTime);
    stringsGain.connect(masterGain);

    // Sweeping string arpeggios
    const stringChord = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const arpeggioSpeed = 0.125; // 8th notes
    
    for (let i = 0; i < duration; i += arpeggioSpeed * 4) {
      for (let j = 0; j < stringChord.length; j++) {
        const string = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const noteTime = startTime + i + (j * arpeggioSpeed);
        
        string.connect(noteGain);
        noteGain.connect(stringsGain);
        
        string.type = 'sine';
        string.frequency.value = stringChord[j];
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.4, noteTime + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + arpeggioSpeed * 2);
        
        string.start(noteTime);
        string.stop(noteTime + arpeggioSpeed * 2);
        this.genericMusicNodes.push(string, noteGain);
      }
    }
    
    this.genericMusicNodes.push(stringsGain);
  }

  private createLeadMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.3, startTime);
    melodyGain.connect(masterGain);

    // Epic main melody (inspired by FF battle themes)
    const melody = [
      {note: 523.25, duration: 0.5}, // C5
      {note: 659.26, duration: 0.5}, // E5
      {note: 783.99, duration: 1.0}, // G5
      {note: 659.26, duration: 0.5}, // E5
      {note: 523.25, duration: 0.5}, // C5
      {note: 587.33, duration: 1.0}, // D5
      {note: 523.25, duration: 1.0}, // C5
    ];
    
    const melodyLength = melody.reduce((sum, note) => sum + note.duration, 0);
    let currentTime = 0;
    
    for (let i = 0; i < duration; i += melodyLength + 1) {
      currentTime = 0;
      for (const noteData of melody) {
        const lead = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const vibrato = ctx.createOscillator();
        const vibratoGain = ctx.createGain();
        
        // Setup vibrato
        vibrato.frequency.value = 6;
        vibratoGain.gain.value = 10;
        vibrato.connect(vibratoGain);
        vibratoGain.connect(lead.frequency);
        
        lead.connect(noteGain);
        noteGain.connect(melodyGain);
        
        lead.type = 'triangle';
        lead.frequency.value = noteData.note;
        
        const noteTime = startTime + i + currentTime;
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.6, noteTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.3, noteTime + noteData.duration * 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + noteData.duration);
        
        lead.start(noteTime);
        lead.stop(noteTime + noteData.duration);
        vibrato.start(noteTime);
        vibrato.stop(noteTime + noteData.duration);
        
        this.genericMusicNodes.push(lead, noteGain, vibrato, vibratoGain);
        currentTime += noteData.duration;
      }
    }
    
    this.genericMusicNodes.push(melodyGain);
  }

  public stopGenericMusic() {
    this.genericMusicPlaying = false;
    this.genericMusicNodes.forEach(node => {
      try {
        if ('stop' in node) {
          (node as AudioBufferSourceNode | OscillatorNode).stop();
        } else if ('disconnect' in node) {
          node.disconnect();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.genericMusicNodes = [];
  }

  /**
   * MARKETPLACE AMBIENT - Atmospheric marketplace sounds
   */
  private marketplaceNodes: AudioNode[] = [];
  private marketplacePlaying = false;

  public playMarketplaceAmbient() {
    if (this.isMuted || this.marketplacePlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.marketplacePlaying = true;
      this.marketplaceNodes = [];
      const now = ctx.currentTime;
      const duration = 60; // 1 minute of ambient sound

      // Create master gain with fade-in
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.12 * this.masterVolume, now + 3); // 3 second fade-in
      masterGain.connect(ctx.destination);
      this.marketplaceNodes.push(masterGain);

      // Create ambient marketplace layers
      this.createCrowdMurmur(ctx, now, duration, masterGain);
      this.createDistantFlute(ctx, now, duration, masterGain);
      this.createMarketplaceCalls(ctx, now, duration, masterGain);
      this.createFootstepAmbient(ctx, now, duration, masterGain);
      this.createCoinJingles(ctx, now, duration, masterGain);

      // Loop after duration
      setTimeout(() => {
        if (this.marketplacePlaying) {
          this.stopMarketplaceAmbient();
          setTimeout(() => this.playMarketplaceAmbient(), 100);
        }
      }, duration * 1000);

    } catch (error) {
      console.error('Error playing marketplace ambient:', error);
      this.marketplacePlaying = false;
    }
  }

  private createCrowdMurmur(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const murmurGain = ctx.createGain();
    murmurGain.gain.setValueAtTime(0.4, startTime);
    murmurGain.connect(masterGain);

    // Create continuous crowd murmur using filtered noise
    const murmur = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      // Create slow-changing noise for conversation murmur
      const slowNoise = Math.sin(i / 1000) * 0.3 + Math.sin(i / 1500) * 0.2;
      data[i] = (Math.random() * 2 - 1) * 0.1 + slowNoise * 0.05;
    }
    
    murmur.buffer = buffer;
    murmur.loop = true;
    
    const murmurFilter = ctx.createBiquadFilter();
    murmurFilter.type = 'bandpass';
    murmurFilter.frequency.value = 300;
    murmurFilter.Q.value = 2;
    
    murmur.connect(murmurFilter);
    murmurFilter.connect(murmurGain);
    
    murmur.start(startTime);
    this.marketplaceNodes.push(murmur, murmurGain, murmurFilter);
  }

  private createDistantFlute(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const fluteGain = ctx.createGain();
    fluteGain.gain.setValueAtTime(0.15, startTime);
    fluteGain.connect(masterGain);

    // Simple pentatonic melody (C D E G A)
    const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00];
    const noteLength = 2.0; // 2 seconds per note
    
    for (let i = 0; i < duration; i += noteLength * 8) {
      // Play 8-note melody phrases
      for (let j = 0; j < 8; j++) {
        if (Math.random() > 0.3) { // 70% chance to play note (some silence)
          const noteIndex = Math.floor(Math.random() * pentatonic.length);
          const flute = ctx.createOscillator();
          const noteGain = ctx.createGain();
          const noteTime = startTime + i + (j * noteLength);
          
          flute.connect(noteGain);
          noteGain.connect(fluteGain);
          
          flute.type = 'sine';
          flute.frequency.value = pentatonic[noteIndex];
          
          noteGain.gain.setValueAtTime(0, noteTime);
          noteGain.gain.linearRampToValueAtTime(0.6, noteTime + 0.2);
          noteGain.gain.exponentialRampToValueAtTime(0.2, noteTime + noteLength * 0.8);
          noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + noteLength);
          
          flute.start(noteTime);
          flute.stop(noteTime + noteLength);
          this.marketplaceNodes.push(flute, noteGain);
        }
      }
    }
    
    this.marketplaceNodes.push(fluteGain);
  }

  private createMarketplaceCalls(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const callsGain = ctx.createGain();
    callsGain.gain.setValueAtTime(0.08, startTime);
    callsGain.connect(masterGain);

    // Occasional merchant calls
    for (let i = 0; i < duration; i += 8 + Math.random() * 12) {
      if (Math.random() > 0.6) { // 40% chance for a call
        const call = ctx.createOscillator();
        const callGain = ctx.createGain();
        const callTime = startTime + i;
        
        call.connect(callGain);
        callGain.connect(callsGain);
        
        call.type = 'triangle';
        call.frequency.setValueAtTime(200 + Math.random() * 100, callTime);
        call.frequency.linearRampToValueAtTime(300 + Math.random() * 50, callTime + 0.3);
        
        callGain.gain.setValueAtTime(0, callTime);
        callGain.gain.linearRampToValueAtTime(0.8, callTime + 0.05);
        callGain.gain.exponentialRampToValueAtTime(0.01, callTime + 0.4);
        
        call.start(callTime);
        call.stop(callTime + 0.4);
        this.marketplaceNodes.push(call, callGain);
      }
    }
    
    this.marketplaceNodes.push(callsGain);
  }

  private createFootstepAmbient(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const footstepsGain = ctx.createGain();
    footstepsGain.gain.setValueAtTime(0.05, startTime);
    footstepsGain.connect(masterGain);

    // Random footsteps
    for (let i = 0; i < duration; i += 0.5 + Math.random() * 2) {
      const footstep = ctx.createBufferSource();
      const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let j = 0; j < buffer.length; j++) {
        data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (buffer.length * 0.3));
      }
      
      footstep.buffer = buffer;
      
      const stepGain = ctx.createGain();
      const stepFilter = ctx.createBiquadFilter();
      
      footstep.connect(stepFilter);
      stepFilter.connect(stepGain);
      stepGain.connect(footstepsGain);
      
      stepFilter.type = 'lowpass';
      stepFilter.frequency.value = 800 + Math.random() * 400;
      
      stepGain.gain.setValueAtTime(0.3 + Math.random() * 0.4, startTime + i);
      
      footstep.start(startTime + i);
      this.marketplaceNodes.push(footstep, stepGain, stepFilter);
    }
    
    this.marketplaceNodes.push(footstepsGain);
  }

  private createCoinJingles(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const coinsGain = ctx.createGain();
    coinsGain.gain.setValueAtTime(0.06, startTime);
    coinsGain.connect(masterGain);

    // Occasional coin sounds
    for (let i = 0; i < duration; i += 5 + Math.random() * 15) {
      if (Math.random() > 0.7) { // 30% chance for coin jingle
        // Create multiple coin clinks
        for (let j = 0; j < 3 + Math.random() * 4; j++) {
          const coin = ctx.createOscillator();
          const coinGain = ctx.createGain();
          const coinTime = startTime + i + (j * 0.05);
          
          coin.connect(coinGain);
          coinGain.connect(coinsGain);
          
          coin.type = 'sine';
          coin.frequency.value = 2000 + Math.random() * 1000;
          
          coinGain.gain.setValueAtTime(0.4, coinTime);
          coinGain.gain.exponentialRampToValueAtTime(0.01, coinTime + 0.1);
          
          coin.start(coinTime);
          coin.stop(coinTime + 0.1);
          this.marketplaceNodes.push(coin, coinGain);
        }
      }
    }
    
    this.marketplaceNodes.push(coinsGain);
  }

  public stopMarketplaceAmbient() {
    this.marketplacePlaying = false;
    this.marketplaceNodes.forEach(node => {
      try {
        if ('stop' in node) {
          (node as AudioBufferSourceNode | OscillatorNode).stop();
        } else if ('disconnect' in node) {
          node.disconnect();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.marketplaceNodes = [];
  }

  /**
   * INTENSE BATTLE MUSIC - Heroic, upbeat FF6/Zelda-style combat music
   */
  private battleNodes: AudioNode[] = [];
  private battlePlaying = false;

  public playIntenseBattleMusic() {
    if (this.isMuted || this.battlePlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.battlePlaying = true;
      this.battleNodes = [];
      const now = ctx.currentTime;
      const duration = 45; // 45 seconds of heroic battle

      // Create master gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.18 * this.masterVolume, now);
      masterGain.connect(ctx.destination);
      this.battleNodes.push(masterGain);

      // Create heroic, upbeat musical layers (FF6/Zelda style)
      this.createHeroicBass(ctx, now, duration, masterGain);
      this.createDrivingDrums(ctx, now, duration, masterGain);
      this.createTriumphantBrass(ctx, now, duration, masterGain);
      this.createExcitingStrings(ctx, now, duration, masterGain);
      this.createHeroicMelody(ctx, now, duration, masterGain);

      // Stop after duration
      setTimeout(() => {
        this.stopIntenseBattleMusic();
      }, duration * 1000);

    } catch (error) {
      console.error('Error playing intense battle music:', error);
      this.battlePlaying = false;
    }
  }

  private createHeroicBass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.4, startTime);
    bassGain.connect(masterGain);

    // Heroic progression like FF6: C - G - Am - F - C - G - C (I-V-vi-IV pattern)
    const heroicBass = [
      65.41, 65.41, 98.00, 98.00,  // C2, C2, G2, G2
      55.00, 55.00, 87.31, 87.31,  // A1, A1, F2, F2
    ];
    const noteLength = 0.5; // Fast, driving rhythm

    for (let i = 0; i < duration; i += noteLength) {
      const noteIndex = Math.floor(i / noteLength) % heroicBass.length;
      const bass = ctx.createOscillator();
      const noteGain = ctx.createGain();
      
      bass.connect(noteGain);
      noteGain.connect(bassGain);
      
      bass.type = 'square'; // Punchy, retro game sound
      bass.frequency.value = heroicBass[noteIndex];
      
      // Add octave double for power
      const octaveBass = ctx.createOscillator();
      octaveBass.connect(noteGain);
      octaveBass.type = 'triangle';
      octaveBass.frequency.value = heroicBass[noteIndex] * 2;
      
      noteGain.gain.setValueAtTime(0.8, startTime + i);
      noteGain.gain.exponentialRampToValueAtTime(0.4, startTime + i + noteLength * 0.8);
      noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + noteLength);
      
      bass.start(startTime + i);
      bass.stop(startTime + i + noteLength);
      octaveBass.start(startTime + i);
      octaveBass.stop(startTime + i + noteLength);
      this.battleNodes.push(bass, octaveBass, noteGain);
    }
    
    this.battleNodes.push(bassGain);
  }

  private createDrivingDrums(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const drumGain = ctx.createGain();
    drumGain.gain.setValueAtTime(0.5, startTime);
    drumGain.connect(masterGain);

    const beat = 0.125; // 16th notes at 120 BPM - classic FF6 speed
    
    for (let i = 0; i < duration; i += beat) {
      const sixteenth = Math.floor(i / beat) % 16;
      
      // FF6-style drum pattern with galloping rhythm
      if (sixteenth === 0 || sixteenth === 6 || sixteenth === 10) {
        this.createPunchyKick(ctx, startTime + i, drumGain);
      }
      
      if (sixteenth === 4 || sixteenth === 12) {
        this.createCrispSnare(ctx, startTime + i, drumGain);
      }
      
      // Hi-hat on off-beats for energy
      if (sixteenth % 2 === 1) {
        this.createHiHat(ctx, startTime + i, drumGain);
      }
      
      // Crash cymbal every 2 measures
      if (sixteenth === 0 && Math.floor(i / (beat * 16)) % 2 === 0) {
        this.createCrashCymbal(ctx, startTime + i, drumGain);
      }
    }
    
    this.battleNodes.push(drumGain);
  }

  private createPunchyKick(ctx: AudioContext, time: number, drumGain: GainNode) {
    const kick = ctx.createOscillator();
    const kickGain = ctx.createGain();
    
    kick.connect(kickGain);
    kickGain.connect(drumGain);
    
    kick.type = 'sine';
    kick.frequency.setValueAtTime(80, time); // Higher pitch for punchier sound
    kick.frequency.exponentialRampToValueAtTime(40, time + 0.1);
    
    kickGain.gain.setValueAtTime(0.9, time);
    kickGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    kick.start(time);
    kick.stop(time + 0.1);
    this.battleNodes.push(kick, kickGain);
  }

  private createCrispSnare(ctx: AudioContext, time: number, drumGain: GainNode) {
    const snare = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.2));
    }
    
    snare.buffer = buffer;
    
    const snareGain = ctx.createGain();
    const snareFilter = ctx.createBiquadFilter();
    
    snare.connect(snareFilter);
    snareFilter.connect(snareGain);
    snareGain.connect(drumGain);
    
    snareFilter.type = 'bandpass';
    snareFilter.frequency.value = 500; // Crisp snap
    snareFilter.Q.value = 5;
    
    snareGain.gain.setValueAtTime(0.6, time);
    snareGain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);
    
    snare.start(time);
    this.battleNodes.push(snare, snareGain, snareFilter);
  }

  private createHiHat(ctx: AudioContext, time: number, drumGain: GainNode) {
    const hihat = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.1));
    }
    
    hihat.buffer = buffer;
    
    const hihatGain = ctx.createGain();
    const hihatFilter = ctx.createBiquadFilter();
    
    hihat.connect(hihatFilter);
    hihatFilter.connect(hihatGain);
    hihatGain.connect(drumGain);
    
    hihatFilter.type = 'highpass';
    hihatFilter.frequency.value = 8000; // Bright and crisp
    
    hihatGain.gain.setValueAtTime(0.2, time);
    hihatGain.gain.exponentialRampToValueAtTime(0.01, time + 0.02);
    
    hihat.start(time);
    this.battleNodes.push(hihat, hihatGain, hihatFilter);
  }

  private createCrashCymbal(ctx: AudioContext, time: number, drumGain: GainNode) {
    const crash = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.3));
    }
    
    crash.buffer = buffer;
    
    const crashGain = ctx.createGain();
    const crashFilter = ctx.createBiquadFilter();
    
    crash.connect(crashFilter);
    crashFilter.connect(crashGain);
    crashGain.connect(drumGain);
    
    crashFilter.type = 'highpass';
    crashFilter.frequency.value = 5000;
    
    crashGain.gain.setValueAtTime(0.4, time);
    crashGain.gain.exponentialRampToValueAtTime(0.01, time + 1.5);
    
    crash.start(time);
    this.battleNodes.push(crash, crashGain, crashFilter);
  }

  private createTriumphantBrass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const brassGain = ctx.createGain();
    brassGain.gain.setValueAtTime(0.3, startTime);
    brassGain.connect(masterGain);

    // Triumphant major chords - FF6 style fanfare
    const heroicChords = [
      [261.63, 329.63, 392.00], // C4, E4, G4 - C major
      [293.66, 369.99, 440.00], // D4, F#4, A4 - D major  
      [329.63, 415.30, 493.88], // E4, G#4, B4 - E major
      [349.23, 440.00, 523.25]  // F4, A4, C5 - F major
    ];
    
    const chordInterval = 2.0; // Faster chord changes for excitement
    
    for (let i = 0; i < duration; i += chordInterval) {
      const chordIndex = Math.floor(i / chordInterval) % heroicChords.length;
      const chord = heroicChords[chordIndex];
      
      for (let j = 0; j < chord.length; j++) {
        const brass = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const noteTime = startTime + i;
        
        brass.connect(noteGain);
        noteGain.connect(brassGain);
        
        brass.type = 'sawtooth';
        brass.frequency.value = chord[j];
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.7, noteTime + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.1, noteTime + chordInterval * 0.8);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + chordInterval);
        
        brass.start(noteTime);
        brass.stop(noteTime + chordInterval);
        this.battleNodes.push(brass, noteGain);
      }
    }
    
    this.battleNodes.push(brassGain);
  }

  private createExcitingStrings(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const stringsGain = ctx.createGain();
    stringsGain.gain.setValueAtTime(0.25, startTime);
    stringsGain.connect(masterGain);

    // Arpeggiated strings for excitement (FF6 style)
    const arpeggioSpeed = 0.0625; // 16th notes
    const stringNotes = [523.25, 659.25, 783.99, 659.25]; // C5, E5, G5, E5 (major arpeggio)
    
    for (let i = 0; i < duration; i += arpeggioSpeed * 4) {
      for (let j = 0; j < stringNotes.length; j++) {
        const string = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const noteTime = startTime + i + (j * arpeggioSpeed);
        
        string.connect(noteGain);
        noteGain.connect(stringsGain);
        
        string.type = 'triangle';
        string.frequency.value = stringNotes[j % stringNotes.length];
        
        // Fast tremolo effect
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.5, noteTime + 0.01);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + arpeggioSpeed);
        
        string.start(noteTime);
        string.stop(noteTime + arpeggioSpeed);
        this.battleNodes.push(string, noteGain);
      }
    }
    
    this.battleNodes.push(stringsGain);
  }

  private createHeroicMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.35, startTime);
    melodyGain.connect(masterGain);

    // Heroic melody inspired by FF6 and Zelda battle themes
    const heroicMelody = [
      {note: 523.25, duration: 0.5},  // C5
      {note: 523.25, duration: 0.25}, // C5
      {note: 587.33, duration: 0.25}, // D5
      {note: 659.25, duration: 0.5},  // E5
      {note: 523.25, duration: 0.5},  // C5
      {note: 783.99, duration: 0.75}, // G5
      {note: 698.46, duration: 0.25}, // F5
      {note: 659.25, duration: 0.5},  // E5
      {note: 587.33, duration: 0.5},  // D5
      {note: 523.25, duration: 1.0},  // C5
    ];
    
    const melodyLength = heroicMelody.reduce((sum, note) => sum + note.duration, 0);
    let currentTime = 0;
    
    for (let i = 0; i < duration; i += melodyLength + 0.5) {
      currentTime = 0;
      for (const noteData of heroicMelody) {
        const lead = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        lead.connect(noteGain);
        noteGain.connect(melodyGain);
        
        lead.type = 'square'; // Classic retro game sound
        lead.frequency.value = noteData.note;
        
        const noteTime = startTime + i + currentTime;
        
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.8, noteTime + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.4, noteTime + noteData.duration * 0.7);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + noteData.duration);
        
        lead.start(noteTime);
        lead.stop(noteTime + noteData.duration);
        
        this.battleNodes.push(lead, noteGain);
        currentTime += noteData.duration;
      }
    }
    
    this.battleNodes.push(melodyGain);
  }

  public stopIntenseBattleMusic() {
    this.battlePlaying = false;
    this.battleNodes.forEach(node => {
      try {
        if ('stop' in node) {
          (node as AudioBufferSourceNode | OscillatorNode).stop();
        } else if ('disconnect' in node) {
          node.disconnect();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.battleNodes = [];
  }

  // Environmental Soundscape System
  private currentSoundscapeNodes: any[] = [];
  private soundscapePlaying: boolean = false;

  public playEnvironmentalSoundscape(biome: string, weather?: any) {
    if (this.soundscapePlaying) {
      this.stopEnvironmentalSoundscape();
    }

    const ctx = this.ensureAudioContext();
    if (!ctx || this.isMuted) return;

    this.soundscapePlaying = true;

    // Map biomes to soundscape categories (limited palette of 10-12)
    let soundscapeType = this.mapBiomeToSoundscape(biome);

    // Generate base soundscape
    this.generateSoundscapeByType(ctx, soundscapeType);

    // Add weather overlay if present
    if (weather?.conditions) {
      this.addWeatherOverlay(ctx, weather.conditions);
    }
  }

  private mapBiomeToSoundscape(biome: string): string {
    const biomeMap: Record<string, string> = {
      // Water/Coastal - River sounds
      'RIVER': 'river',
      'MAJOR_RIVER': 'river',
      'RIVERBANK': 'river',
      'ESTUARY': 'river',
      'FRESHWATER_LAKE': 'river',

      // Ocean/Coastal - Ocean sounds
      'DEEP_OCEAN': 'ocean',
      'SHALLOW_OCEAN': 'ocean',
      'BEACH': 'ocean',

      // Wetlands - Combined water/swamp sounds
      'WETLANDS': 'wetlands',
      'MANGROVE': 'wetlands',

      // Dense Urban - City soundscape
      'DENSE_CITY': 'urban',
      'CITY_CENTER': 'urban',
      'URBAN': 'urban',
      'GOVERNMENT_DISTRICT': 'urban',
      'PALACE': 'urban',
      'HARBOR_DISTRICT': 'urban',
      'INDUSTRIAL_DISTRICT': 'urban',

      // Light Urban - Same as dense urban
      'LOW_DENSITY_CITY': 'urban',
      'MARKETPLACE': 'urban',
      'PLAZA': 'urban',
      'ROAD': 'urban',

      // Rural/Farm - Wind and crickets
      'HAMLET': 'rural',
      'FARMLAND': 'rural',
      'PARK': 'rural',

      // Forest - Wind through leaves + birds
      'FOREST': 'forest',
      'DENSE_FOREST': 'forest',
      'JUNGLE': 'forest',

      // Mountains - High altitude wind
      'HILLS': 'mountain',
      'MOUNTAIN': 'mountain',
      'HIGH_PEAK': 'mountain',
      'CLIFF': 'mountain',
      'VOLCANIC_ROCK': 'mountain',
      'VOLCANIC_SOIL': 'mountain',

      // Desert - Subtle wind and sand
      'DESERT': 'desert',
      'SALT_FLATS': 'desert',

      // Grasslands - Wind through grass + crickets (same as rural)
      'GRASSLAND': 'grassland',
      'STEPPE': 'grassland',
      'SCRUB': 'grassland',
      'TUNDRA': 'grassland',

      // Underground/Caves - Echo and dripping
      'RUINS': 'cave',
      'HOLY_SITE': 'cave',

      // Geothermal/Special
      'HOT_SPRINGS': 'river', // Water sounds
      'ACTIVE_LAVA': 'mountain', // Wind sounds
      'SNOW': 'grassland' // Wind sounds
    };

    return biomeMap[biome] || 'grassland';
  }

  private generateSoundscapeByType(ctx: AudioContext, type: string) {
    switch (type) {
      case 'river':
        this.createRiverSoundscape(ctx);
        break;
      case 'ocean':
        this.createOceanSoundscape(ctx);
        break;
      case 'urban':
        this.createUrbanSoundscape(ctx);
        break;
      case 'rural':
        this.createRuralSoundscape(ctx);
        break;
      case 'forest':
        this.createForestSoundscape(ctx);
        break;
      case 'mountain':
        this.createMountainSoundscape(ctx);
        break;
      case 'desert':
        this.createDesertSoundscape(ctx);
        break;
      case 'grassland':
        this.createGrasslandSoundscape(ctx);
        break;
      case 'wetlands':
        this.createWetlandsSoundscape(ctx);
        break;
      case 'cave':
        this.createCaveSoundscape(ctx);
        break;
      default:
        this.createGrasslandSoundscape(ctx);
    }
  }

  private createRiverSoundscape(ctx: AudioContext) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.08, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // LAYER 1: Main water flow - gentle babbling brook
    const waterBuffer = ctx.createBuffer(1, ctx.sampleRate * 45, ctx.sampleRate);
    const waterData = waterBuffer.getChannelData(0);

    for (let i = 0; i < waterData.length; i++) {
      const time = i / ctx.sampleRate;
      // Multiple layers of water sounds
      const bubbling = (Math.random() - 0.5) * 0.1 * (1 + Math.sin(time * 0.3));
      const flow = Math.sin(time * 0.15) * 0.08; // Very slow main flow
      const ripples = Math.sin(time * 1.5) * 0.03 * Math.random(); // Faster ripples
      const gurgle = Math.random() < 0.001 ? (Math.random() - 0.5) * 0.3 : 0; // Occasional gurgle
      waterData[i] = bubbling + flow + ripples + gurgle;
    }

    const waterSource = ctx.createBufferSource();
    waterSource.buffer = waterBuffer;
    waterSource.loop = true;

    const waterFilter = ctx.createBiquadFilter();
    waterFilter.type = 'bandpass';
    waterFilter.frequency.value = 500;
    waterFilter.Q.value = 1.2;

    waterSource.connect(waterFilter);
    waterFilter.connect(masterGain);
    waterSource.start();

    // LAYER 2: High frequency water splashes
    const splashBuffer = ctx.createBuffer(1, ctx.sampleRate * 20, ctx.sampleRate);
    const splashData = splashBuffer.getChannelData(0);

    for (let i = 0; i < splashData.length; i++) {
      const time = i / ctx.sampleRate;
      if (Math.random() < 0.0005) { // Occasional splash
        splashData[i] = (Math.random() - 0.5) * 0.2 * Math.exp(-time * 10);
      } else {
        splashData[i] = (Math.random() - 0.5) * 0.01; // Subtle high freq noise
      }
    }

    const splashSource = ctx.createBufferSource();
    splashSource.buffer = splashBuffer;
    splashSource.loop = true;

    const splashFilter = ctx.createBiquadFilter();
    splashFilter.type = 'highpass';
    splashFilter.frequency.value = 2000;

    const splashGain = ctx.createGain();
    splashGain.gain.value = 0.4;

    splashSource.connect(splashFilter);
    splashFilter.connect(splashGain);
    splashGain.connect(masterGain);
    splashSource.start();

    // LAYER 3: Underwater resonance (deep bass)
    const bassOsc = ctx.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = 45; // Deep water resonance

    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.02, ctx.currentTime);

    // Subtle modulation
    const bassLfo = ctx.createOscillator();
    bassLfo.frequency.value = 0.1;
    bassLfo.start();

    const bassLfoGain = ctx.createGain();
    bassLfoGain.gain.value = 3;

    bassLfo.connect(bassLfoGain);
    bassLfoGain.connect(bassOsc.frequency);

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start();

    // LAYER 4: Wildlife - Frogs croaking at different distances
    this.addRiverFrogs(ctx, masterGain);

    // LAYER 5: Insects - Multiple cricket types with varying rhythms
    setTimeout(() => this.addRiverCrickets(ctx, masterGain), 3000);

    // LAYER 6: Birds - Various water birds
    setTimeout(() => this.addWaterBirds(ctx, masterGain), 5000);

    // LAYER 7: Occasional fish jumping
    this.addFishJumps(ctx, masterGain);

    // LAYER 8: Dragonfly buzzing
    setTimeout(() => this.addDragonflyBuzz(ctx, masterGain), 8000);

    this.currentSoundscapeNodes.push(
      waterSource, waterFilter,
      splashSource, splashFilter, splashGain,
      bassOsc, bassGain, bassLfo, bassLfoGain,
      masterGain
    );
  }

  private addRiverFrogs(ctx: AudioContext, masterGain: GainNode) {
    // Multiple frog types at different distances
    const frogTypes = [
      { freq: 180, rate: 15000, gain: 0.04, distance: 'close' },
      { freq: 120, rate: 22000, gain: 0.02, distance: 'medium' },
      { freq: 90, rate: 30000, gain: 0.01, distance: 'far' }
    ];

    frogTypes.forEach(frogType => {
      const createFrog = () => {
        if (!this.soundscapePlaying) return;

        const frog = ctx.createOscillator();
        const frogGain = ctx.createGain();
        const frogFilter = ctx.createBiquadFilter();

        frog.type = 'sawtooth';
        frog.frequency.setValueAtTime(frogType.freq + Math.random() * 40, ctx.currentTime);

        // Realistic ribbit pattern
        for (let i = 0; i < 3 + Math.random() * 4; i++) {
          const t = ctx.currentTime + i * 0.15;
          frog.frequency.exponentialRampToValueAtTime(frogType.freq * 1.2, t + 0.05);
          frog.frequency.exponentialRampToValueAtTime(frogType.freq * 0.8, t + 0.1);
        }

        frogFilter.type = 'bandpass';
        frogFilter.frequency.value = frogType.freq * 2;
        frogFilter.Q.value = 10;

        frogGain.gain.setValueAtTime(0, ctx.currentTime);
        frogGain.gain.linearRampToValueAtTime(frogType.gain, ctx.currentTime + 0.1);
        frogGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);

        frog.connect(frogFilter);
        frogFilter.connect(frogGain);
        frogGain.connect(masterGain);

        frog.start();
        frog.stop(ctx.currentTime + 2);

        setTimeout(createFrog, frogType.rate + Math.random() * 20000);
      };

      setTimeout(createFrog, Math.random() * 10000);
    });
  }

  private addRiverCrickets(ctx: AudioContext, masterGain: GainNode) {
    // Multiple cricket layers with different rhythms
    const cricketTypes = [
      { freq: 4500, pattern: [100, 100, 200], gain: 0.01 }, // Fast cricket
      { freq: 3200, pattern: [150, 150, 150, 400], gain: 0.008 }, // Medium cricket
      { freq: 2800, pattern: [200, 300], gain: 0.006 } // Slow cricket
    ];

    cricketTypes.forEach((cricketType, index) => {
      const createCricketSequence = () => {
        if (!this.soundscapePlaying) return;

        let totalTime = 0;
        cricketType.pattern.forEach((duration, i) => {
          setTimeout(() => {
            const cricket = ctx.createOscillator();
            const cricketGain = ctx.createGain();

            cricket.type = 'triangle';
            cricket.frequency.value = cricketType.freq + Math.random() * 500;

            cricketGain.gain.setValueAtTime(0, ctx.currentTime);
            cricketGain.gain.linearRampToValueAtTime(cricketType.gain, ctx.currentTime + 0.01);
            cricketGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

            cricket.connect(cricketGain);
            cricketGain.connect(masterGain);

            cricket.start();
            cricket.stop(ctx.currentTime + duration / 1000);
          }, totalTime);

          totalTime += duration;
        });

        setTimeout(createCricketSequence, 8000 + index * 3000 + Math.random() * 10000);
      };

      setTimeout(createCricketSequence, index * 2000 + Math.random() * 5000);
    });
  }

  private addWaterBirds(ctx: AudioContext, masterGain: GainNode) {
    // Different bird calls for river environment
    const birdTypes = [
      { name: 'kingfisher', freq: [2000, 2500, 2200], interval: 25000 },
      { name: 'duck', freq: [400, 350, 400], interval: 35000 },
      { name: 'heron', freq: [800, 700, 600], interval: 45000 }
    ];

    birdTypes.forEach(bird => {
      const createBirdCall = () => {
        if (!this.soundscapePlaying) return;

        bird.freq.forEach((freq, i) => {
          setTimeout(() => {
            const birdOsc = ctx.createOscillator();
            const birdGain = ctx.createGain();

            birdOsc.type = 'sine';
            birdOsc.frequency.setValueAtTime(freq, ctx.currentTime);
            birdOsc.frequency.exponentialRampToValueAtTime(freq * 1.1, ctx.currentTime + 0.1);

            birdGain.gain.setValueAtTime(0, ctx.currentTime);
            birdGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.02);
            birdGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

            birdOsc.connect(birdGain);
            birdGain.connect(masterGain);

            birdOsc.start();
            birdOsc.stop(ctx.currentTime + 0.2);
          }, i * 200);
        });

        setTimeout(createBirdCall, bird.interval + Math.random() * 20000);
      };

      setTimeout(createBirdCall, Math.random() * 15000);
    });
  }

  private addFishJumps(ctx: AudioContext, masterGain: GainNode) {
    const fishJump = () => {
      if (!this.soundscapePlaying) return;

      // Splash sound
      const noise = ctx.createBufferSource();
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);

      for (let i = 0; i < noiseData.length; i++) {
        const t = i / ctx.sampleRate;
        noiseData[i] = (Math.random() - 0.5) * Math.exp(-t * 20) * 0.3;
      }

      noise.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1000;
      noiseFilter.Q.value = 2;

      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.15;

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      noise.start();

      setTimeout(fishJump, 30000 + Math.random() * 60000);
    };

    setTimeout(fishJump, 10000 + Math.random() * 20000);
  }

  private addDragonflyBuzz(ctx: AudioContext, masterGain: GainNode) {
    const dragonfly = () => {
      if (!this.soundscapePlaying) return;

      const buzz = ctx.createOscillator();
      const buzzGain = ctx.createGain();

      buzz.type = 'sawtooth';
      buzz.frequency.setValueAtTime(150, ctx.currentTime);

      // Dragonfly passes by
      for (let i = 0; i < 20; i++) {
        const t = ctx.currentTime + i * 0.1;
        buzz.frequency.exponentialRampToValueAtTime(150 + Math.random() * 50, t + 0.05);
      }

      buzzGain.gain.setValueAtTime(0, ctx.currentTime);
      buzzGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.5);
      buzzGain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 1);
      buzzGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);

      buzz.connect(buzzGain);
      buzzGain.connect(masterGain);

      buzz.start();
      buzz.stop(ctx.currentTime + 2);

      setTimeout(dragonfly, 40000 + Math.random() * 40000);
    };

    setTimeout(dragonfly, 5000);
  }

  private createOceanSoundscape(ctx: AudioContext) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.1, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Ocean waves with rhythmic pattern
    const waveBuffer = ctx.createBuffer(1, ctx.sampleRate * 8, ctx.sampleRate);
    const waveData = waveBuffer.getChannelData(0);

    for (let i = 0; i < waveData.length; i++) {
      const t = i / ctx.sampleRate;
      waveData[i] = Math.sin(t * 0.5) * (Math.random() - 0.5) * 0.4;
    }

    const waveSource = ctx.createBufferSource();
    waveSource.buffer = waveBuffer;
    waveSource.loop = true;

    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.value = 1200;

    waveSource.connect(waveFilter);
    waveFilter.connect(masterGain);
    waveSource.start();

    this.currentSoundscapeNodes.push(waveSource, waveFilter, masterGain);
  }

  private createUrbanSoundscape(ctx: AudioContext) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // LAYER 1: Base crowd murmur with variation
    const crowdBuffer = ctx.createBuffer(1, ctx.sampleRate * 30, ctx.sampleRate);
    const crowdData = crowdBuffer.getChannelData(0);

    for (let i = 0; i < crowdData.length; i++) {
      const time = i / ctx.sampleRate;
      // Multiple crowd layers
      const distantCrowd = (Math.random() - 0.5) * 0.08 * (1 + Math.sin(time * 0.05));
      const mediumCrowd = (Math.random() - 0.5) * 0.06 * Math.sin(time * 0.1);
      const chatter = Math.random() < 0.001 ? (Math.random() - 0.5) * 0.2 : 0; // Occasional louder voice
      crowdData[i] = distantCrowd + mediumCrowd + chatter;
    }

    const crowdSource = ctx.createBufferSource();
    crowdSource.buffer = crowdBuffer;
    crowdSource.loop = true;

    const crowdFilter = ctx.createBiquadFilter();
    crowdFilter.type = 'lowpass';
    crowdFilter.frequency.value = 600;
    crowdFilter.Q.value = 0.7;

    crowdSource.connect(crowdFilter);
    crowdFilter.connect(masterGain);
    crowdSource.start();

    // LAYER 2: Traffic/movement sounds
    this.addUrbanTraffic(ctx, masterGain);

    // LAYER 3: Footsteps on pavement
    this.addUrbanFootsteps(ctx, masterGain);

    // LAYER 4: Church/clock bells
    setTimeout(() => this.addUrbanBells(ctx, masterGain), 5000);

    // LAYER 5: Merchant calls and street vendors
    setTimeout(() => this.addStreetVendors(ctx, masterGain), 3000);

    // LAYER 6: Dogs barking
    setTimeout(() => this.addUrbanDogs(ctx, masterGain), 10000);

    // LAYER 7: Pigeons/birds
    this.addUrbanBirds(ctx, masterGain);

    // LAYER 8: Doors and shutters
    this.addUrbanDoors(ctx, masterGain);

    // LAYER 9: Construction/hammering
    setTimeout(() => this.addUrbanConstruction(ctx, masterGain), 15000);

    this.currentSoundscapeNodes.push(crowdSource, crowdFilter, masterGain);
  }

  private addUrbanTraffic(ctx: AudioContext, masterGain: GainNode) {
    // Low rumble of carts/vehicles
    const rumble = ctx.createOscillator();
    const rumbleGain = ctx.createGain();
    const rumbleFilter = ctx.createBiquadFilter();

    rumble.type = 'sawtooth';
    rumble.frequency.value = 40;

    // Modulate the rumble
    const rumbleLfo = ctx.createOscillator();
    rumbleLfo.frequency.value = 0.2;
    rumbleLfo.start();

    const rumbleLfoGain = ctx.createGain();
    rumbleLfoGain.gain.value = 5;

    rumbleLfo.connect(rumbleLfoGain);
    rumbleLfoGain.connect(rumble.frequency);

    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 100;

    rumbleGain.gain.value = 0.015;

    rumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(masterGain);
    rumble.start();

    // Occasional horse hooves
    const hooves = () => {
      if (!this.soundscapePlaying) return;

      for (let i = 0; i < 8 + Math.random() * 12; i++) {
        setTimeout(() => {
          const hoof = ctx.createOscillator();
          const hoofGain = ctx.createGain();

          hoof.type = 'sine';
          hoof.frequency.value = 150 + Math.random() * 50;

          hoofGain.gain.setValueAtTime(0.02, ctx.currentTime);
          hoofGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

          hoof.connect(hoofGain);
          hoofGain.connect(masterGain);

          hoof.start();
          hoof.stop(ctx.currentTime + 0.05);
        }, i * 200 + Math.random() * 100);
      }

      setTimeout(hooves, 20000 + Math.random() * 40000);
    };

    setTimeout(hooves, 5000);

    this.currentSoundscapeNodes.push(rumble, rumbleGain, rumbleFilter, rumbleLfo, rumbleLfoGain);
  }

  private addUrbanFootsteps(ctx: AudioContext, masterGain: GainNode) {
    const steps = () => {
      if (!this.soundscapePlaying) return;

      const numSteps = 4 + Math.floor(Math.random() * 6);
      for (let i = 0; i < numSteps; i++) {
        setTimeout(() => {
          const step = ctx.createBufferSource();
          const stepBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
          const stepData = stepBuffer.getChannelData(0);

          for (let j = 0; j < stepData.length; j++) {
            const t = j / ctx.sampleRate;
            stepData[j] = Math.sin(t * 100) * Math.exp(-t * 50) * 0.15;
          }

          step.buffer = stepBuffer;

          const stepGain = ctx.createGain();
          stepGain.gain.value = 0.01 + Math.random() * 0.01;

          step.connect(stepGain);
          stepGain.connect(masterGain);
          step.start();
        }, i * 300);
      }

      setTimeout(steps, 10000 + Math.random() * 20000);
    };

    setTimeout(steps, Math.random() * 5000);
  }

  private addUrbanBells(ctx: AudioContext, masterGain: GainNode) {
    const bell = () => {
      if (!this.soundscapePlaying) return;

      // Church bell sound with harmonics
      const fundamentals = [200, 250, 300, 350];
      const chosenFund = fundamentals[Math.floor(Math.random() * fundamentals.length)];

      [1, 2, 2.4, 3, 4.2].forEach((harmonic, i) => {
        setTimeout(() => {
          const bellOsc = ctx.createOscillator();
          const bellGain = ctx.createGain();

          bellOsc.type = 'sine';
          bellOsc.frequency.value = chosenFund * harmonic;

          bellGain.gain.setValueAtTime(0.02 / (i + 1), ctx.currentTime);
          bellGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);

          bellOsc.connect(bellGain);
          bellGain.connect(masterGain);

          bellOsc.start();
          bellOsc.stop(ctx.currentTime + 3);
        }, i * 20);
      });

      setTimeout(bell, 60000 + Math.random() * 120000); // Every 1-3 minutes
    };

    setTimeout(bell, 10000);
  }

  private addStreetVendors(ctx: AudioContext, masterGain: GainNode) {
    const vendorCall = () => {
      if (!this.soundscapePlaying) return;

      // Simulated voice call
      const syllables = 3 + Math.floor(Math.random() * 4);
      for (let i = 0; i < syllables; i++) {
        setTimeout(() => {
          const voice = ctx.createOscillator();
          const voiceGain = ctx.createGain();
          const voiceFilter = ctx.createBiquadFilter();

          voice.type = 'sawtooth';
          voice.frequency.setValueAtTime(150 + Math.random() * 100, ctx.currentTime);
          voice.frequency.exponentialRampToValueAtTime(120 + Math.random() * 80, ctx.currentTime + 0.2);

          voiceFilter.type = 'bandpass';
          voiceFilter.frequency.value = 800;
          voiceFilter.Q.value = 5;

          voiceGain.gain.setValueAtTime(0, ctx.currentTime);
          voiceGain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.05);
          voiceGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

          voice.connect(voiceFilter);
          voiceFilter.connect(voiceGain);
          voiceGain.connect(masterGain);

          voice.start();
          voice.stop(ctx.currentTime + 0.2);
        }, i * 250);
      }

      setTimeout(vendorCall, 30000 + Math.random() * 60000);
    };

    setTimeout(vendorCall, Math.random() * 20000);
  }

  private addUrbanDogs(ctx: AudioContext, masterGain: GainNode) {
    const bark = () => {
      if (!this.soundscapePlaying) return;

      const barks = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < barks; i++) {
        setTimeout(() => {
          const dog = ctx.createOscillator();
          const dogGain = ctx.createGain();
          const dogFilter = ctx.createBiquadFilter();

          dog.type = 'sawtooth';
          dog.frequency.setValueAtTime(400 + Math.random() * 200, ctx.currentTime);
          dog.frequency.exponentialRampToValueAtTime(300 + Math.random() * 100, ctx.currentTime + 0.1);

          dogFilter.type = 'bandpass';
          dogFilter.frequency.value = 600;
          dogFilter.Q.value = 3;

          dogGain.gain.setValueAtTime(0, ctx.currentTime);
          dogGain.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.02);
          dogGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

          dog.connect(dogFilter);
          dogFilter.connect(dogGain);
          dogGain.connect(masterGain);

          dog.start();
          dog.stop(ctx.currentTime + 0.15);
        }, i * 400);
      }

      setTimeout(bark, 40000 + Math.random() * 80000);
    };

    setTimeout(bark, Math.random() * 30000);
  }

  private addUrbanBirds(ctx: AudioContext, masterGain: GainNode) {
    // City birds (pigeons, sparrows)
    const coo = () => {
      if (!this.soundscapePlaying) return;

      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const pigeon = ctx.createOscillator();
          const pigeonGain = ctx.createGain();

          pigeon.type = 'sine';
          pigeon.frequency.setValueAtTime(400, ctx.currentTime);
          pigeon.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.3);

          pigeonGain.gain.setValueAtTime(0, ctx.currentTime);
          pigeonGain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
          pigeonGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

          pigeon.connect(pigeonGain);
          pigeonGain.connect(masterGain);

          pigeon.start();
          pigeon.stop(ctx.currentTime + 0.3);
        }, i * 350);
      }

      setTimeout(coo, 25000 + Math.random() * 35000);
    };

    setTimeout(coo, 5000);
  }

  private addUrbanDoors(ctx: AudioContext, masterGain: GainNode) {
    const door = () => {
      if (!this.soundscapePlaying) return;

      // Door creak and slam
      const creak = ctx.createOscillator();
      const creakGain = ctx.createGain();

      creak.type = 'sawtooth';
      creak.frequency.setValueAtTime(80, ctx.currentTime);
      creak.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);

      creakGain.gain.setValueAtTime(0.01, ctx.currentTime);
      creakGain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.2);
      creakGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      creak.connect(creakGain);
      creakGain.connect(masterGain);

      creak.start();
      creak.stop(ctx.currentTime + 0.3);

      // Slam after creak
      setTimeout(() => {
        const slam = ctx.createBufferSource();
        const slamBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const slamData = slamBuffer.getChannelData(0);

        for (let i = 0; i < slamData.length; i++) {
          const t = i / ctx.sampleRate;
          slamData[i] = (Math.random() - 0.5) * Math.exp(-t * 30) * 0.3;
        }

        slam.buffer = slamBuffer;

        const slamGain = ctx.createGain();
        slamGain.gain.value = 0.02;

        slam.connect(slamGain);
        slamGain.connect(masterGain);
        slam.start();
      }, 400);

      setTimeout(door, 35000 + Math.random() * 70000);
    };

    setTimeout(door, 10000);
  }

  private addUrbanConstruction(ctx: AudioContext, masterGain: GainNode) {
    const hammer = () => {
      if (!this.soundscapePlaying) return;

      const hits = 3 + Math.floor(Math.random() * 5);
      for (let i = 0; i < hits; i++) {
        setTimeout(() => {
          const hit = ctx.createOscillator();
          const hitGain = ctx.createGain();

          hit.type = 'sine';
          hit.frequency.value = 100;

          hitGain.gain.setValueAtTime(0.025, ctx.currentTime);
          hitGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

          hit.connect(hitGain);
          hitGain.connect(masterGain);

          hit.start();
          hit.stop(ctx.currentTime + 0.05);

          // Metal ring after impact
          const ring = ctx.createOscillator();
          const ringGain = ctx.createGain();

          ring.type = 'sine';
          ring.frequency.value = 800 + Math.random() * 400;

          ringGain.gain.setValueAtTime(0.008, ctx.currentTime);
          ringGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

          ring.connect(ringGain);
          ringGain.connect(masterGain);

          ring.start();
          ring.stop(ctx.currentTime + 0.5);
        }, i * 600);
      }

      setTimeout(hammer, 50000 + Math.random() * 100000);
    };

    setTimeout(hammer, Math.random() * 30000);
  }

  private createRuralSoundscape(ctx: AudioContext) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.05, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Gentle wind and distant farm sounds - FIXED timing
    this.createGentleWindFixed(ctx, masterGain);
    this.addOccasionalBirdCall(ctx, masterGain);

    this.currentSoundscapeNodes.push(masterGain);
  }

  private createForestSoundscape(ctx: AudioContext) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.07, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // LAYER 1: MUCH SUBTLER wind layers through canopy
    const canopyBuffer = ctx.createBuffer(1, ctx.sampleRate * 60, ctx.sampleRate);
    const canopyData = canopyBuffer.getChannelData(0);

    for (let i = 0; i < canopyData.length; i++) {
      const time = i / ctx.sampleRate;
      // Much quieter high canopy wind
      const highWind = (Math.random() - 0.5) * 0.015 * (1 + Math.sin(time * 0.03));
      // Very subtle mid-level rustling
      const midRustle = (Math.random() - 0.5) * 0.01 * Math.sin(time * 0.08);
      // Rare gentle gusts
      const gust = Math.random() < 0.00005 ? (Math.random() - 0.5) * 0.05 : 0;
      canopyData[i] = highWind + midRustle + gust;
    }

    const canopySource = ctx.createBufferSource();
    canopySource.buffer = canopyBuffer;
    canopySource.loop = true;

    const canopyFilter = ctx.createBiquadFilter();
    canopyFilter.type = 'lowpass';  // Changed to lowpass for softer sound
    canopyFilter.frequency.value = 400;  // Lower frequency for subtlety
    canopyFilter.Q.value = 0.3;

    const canopyGain = ctx.createGain();
    canopyGain.gain.value = 0.5;  // Additional reduction

    canopySource.connect(canopyFilter);
    canopyFilter.connect(canopyGain);
    canopyGain.connect(masterGain);
    canopySource.start();

    // LAYER 2: Much subtler leaf rustling
    const leafBuffer = ctx.createBuffer(1, ctx.sampleRate * 35, ctx.sampleRate);
    const leafData = leafBuffer.getChannelData(0);

    for (let i = 0; i < leafData.length; i++) {
      const time = i / ctx.sampleRate;
      const rustleIntensity = Math.sin(time * 0.1) * 0.2 + 0.8;
      const leaves = (Math.random() - 0.5) * 0.02 * rustleIntensity;  // Much quieter
      // Occasional branch creak
      const creak = Math.random() < 0.00003 ? Math.sin(time * 80) * 0.08 : 0;
      leafData[i] = leaves + creak;
    }

    const leafSource = ctx.createBufferSource();
    leafSource.buffer = leafBuffer;
    leafSource.loop = true;

    const leafFilter = ctx.createBiquadFilter();
    leafFilter.type = 'highpass';
    leafFilter.frequency.value = 1500;
    leafFilter.Q.value = 0.7;

    leafSource.connect(leafFilter);
    leafFilter.connect(masterGain);
    leafSource.start();

    // LAYER 3: Forest floor sounds (twigs, small movements)
    this.addForestFloorSounds(ctx, masterGain);

    // LAYER 4: Multiple bird species at different canopy levels
    this.addForestBirds(ctx, masterGain);

    // LAYER 5: Insects - various forest insects
    setTimeout(() => this.addForestInsects(ctx, masterGain), 2000);

    // LAYER 6: Woodpecker
    setTimeout(() => this.addWoodpecker(ctx, masterGain), 10000);

    // LAYER 7: Owl hoots (if evening/night)
    setTimeout(() => this.addOwlHoots(ctx, masterGain), 15000);

    // LAYER 8: Small animals (squirrels, etc)
    this.addSmallAnimalSounds(ctx, masterGain);

    // LAYER 9: Distant wolf or other predator (rare)
    setTimeout(() => this.addDistantPredator(ctx, masterGain), 30000);

    this.currentSoundscapeNodes.push(canopySource, canopyFilter, canopyGain, leafSource, leafFilter, masterGain);
  }

  private addForestFloorSounds(ctx: AudioContext, masterGain: GainNode) {
    const twigSnap = () => {
      if (!this.soundscapePlaying) return;

      const snap = ctx.createBufferSource();
      const snapBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const snapData = snapBuffer.getChannelData(0);

      for (let i = 0; i < snapData.length; i++) {
        const t = i / ctx.sampleRate;
        snapData[i] = Math.sin(t * 200) * Math.exp(-t * 100) * 0.2;
      }

      snap.buffer = snapBuffer;

      const snapGain = ctx.createGain();
      snapGain.gain.value = 0.1;

      snap.connect(snapGain);
      snapGain.connect(masterGain);
      snap.start();

      setTimeout(twigSnap, 20000 + Math.random() * 40000);
    };

    setTimeout(twigSnap, 5000 + Math.random() * 10000);
  }

  private addForestBirds(ctx: AudioContext, masterGain: GainNode) {
    // Different bird species with unique calls
    const birdSpecies = [
      { name: 'songbird', frequencies: [[1800, 2000, 1900], [2200, 2400, 2100]], interval: 15000, gain: 0.025 },
      { name: 'thrush', frequencies: [[1200, 1100, 1300, 1200]], interval: 25000, gain: 0.02 },
      { name: 'warbler', frequencies: [[3000, 3200, 2800, 3100, 2900]], interval: 20000, gain: 0.015 },
      { name: 'crow', frequencies: [[500, 450, 500]], interval: 40000, gain: 0.03 },
      { name: 'finch', frequencies: [[2500, 2700, 2600, 2800]], interval: 18000, gain: 0.018 }
    ];

    birdSpecies.forEach((species, index) => {
      const createBirdSong = () => {
        if (!this.soundscapePlaying) return;

        const songPattern = species.frequencies[Math.floor(Math.random() * species.frequencies.length)];

        songPattern.forEach((freq, i) => {
          setTimeout(() => {
            const bird = ctx.createOscillator();
            const birdGain = ctx.createGain();
            const birdFilter = ctx.createBiquadFilter();

            bird.type = 'sine';
            bird.frequency.setValueAtTime(freq, ctx.currentTime);
            bird.frequency.exponentialRampToValueAtTime(freq * (0.95 + Math.random() * 0.1), ctx.currentTime + 0.1);

            birdFilter.type = 'bandpass';
            birdFilter.frequency.value = freq;
            birdFilter.Q.value = 5;

            birdGain.gain.setValueAtTime(0, ctx.currentTime);
            birdGain.gain.linearRampToValueAtTime(species.gain, ctx.currentTime + 0.02);
            birdGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

            bird.connect(birdFilter);
            birdFilter.connect(birdGain);
            birdGain.connect(masterGain);

            bird.start();
            bird.stop(ctx.currentTime + 0.2);
          }, i * 120);
        });

        setTimeout(createBirdSong, species.interval + Math.random() * 15000);
      };

      setTimeout(createBirdSong, index * 3000 + Math.random() * 5000);
    });
  }

  private addForestInsects(ctx: AudioContext, masterGain: GainNode) {
    // LAYER 1: Gentle bee buzzing (wandering)
    const bee = ctx.createOscillator();
    const beeGain = ctx.createGain();
    const beePanner = ctx.createStereoPanner();

    bee.type = 'sawtooth';
    bee.frequency.value = 180;

    // Bee frequency modulation (buzzing)
    const beeLfo = ctx.createOscillator();
    beeLfo.frequency.value = 12;
    beeLfo.start();

    const beeLfoGain = ctx.createGain();
    beeLfoGain.gain.value = 20;

    beeLfo.connect(beeLfoGain);
    beeLfoGain.connect(bee.frequency);

    // Bee panning (moving around)
    const beePanLfo = ctx.createOscillator();
    beePanLfo.frequency.value = 0.1;  // Very slow panning
    beePanLfo.start();

    const beePanGain = ctx.createGain();
    beePanGain.gain.value = 0.8;

    beePanLfo.connect(beePanGain);
    beePanGain.connect(beePanner.pan);

    beeGain.gain.value = 0.002;  // Very subtle

    bee.connect(beeGain);
    beeGain.connect(beePanner);
    beePanner.connect(masterGain);
    bee.start();

    // LAYER 2: Cicadas (rhythmic pulsing)
    const cicada = ctx.createOscillator();
    const cicadaGain = ctx.createGain();

    cicada.type = 'triangle';
    cicada.frequency.value = 2800;

    const cicadaLfo = ctx.createOscillator();
    cicadaLfo.frequency.value = 7;
    cicadaLfo.start();

    const cicadaLfoGain = ctx.createGain();
    cicadaLfoGain.gain.value = 0.003;

    cicadaLfo.connect(cicadaLfoGain);
    cicadaLfoGain.connect(cicadaGain.gain);

    cicadaGain.gain.value = 0.003;

    cicada.connect(cicadaGain);
    cicadaGain.connect(masterGain);
    cicada.start();

    // LAYER 3: Mosquitos (high pitch whine)
    const mosquito = ctx.createOscillator();
    const mosquitoGain = ctx.createGain();
    const mosquitoPanner = ctx.createStereoPanner();

    mosquito.type = 'sine';
    mosquito.frequency.value = 450;

    // Mosquito frequency variation
    const mosquitoLfo = ctx.createOscillator();
    mosquitoLfo.frequency.value = 3;
    mosquitoLfo.start();

    const mosquitoLfoGain = ctx.createGain();
    mosquitoLfoGain.gain.value = 50;

    mosquitoLfo.connect(mosquitoLfoGain);
    mosquitoLfoGain.connect(mosquito.frequency);

    mosquitoGain.gain.value = 0.001;  // Very quiet

    mosquito.connect(mosquitoGain);
    mosquitoGain.connect(mosquitoPanner);
    mosquitoPanner.connect(masterGain);
    mosquito.start();

    // LAYER 4: Beetles clicking
    const beetleClick = () => {
      if (!this.soundscapePlaying) return;

      const click = ctx.createOscillator();
      const clickGain = ctx.createGain();

      click.type = 'square';
      click.frequency.value = 1500 + Math.random() * 500;

      clickGain.gain.setValueAtTime(0.004, ctx.currentTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.01);

      click.connect(clickGain);
      clickGain.connect(masterGain);

      click.start();
      click.stop(ctx.currentTime + 0.01);

      setTimeout(beetleClick, 5000 + Math.random() * 10000);
    };
    setTimeout(beetleClick, 2000);

    // LAYER 5: Flies (intermittent buzzing)
    const fly = () => {
      if (!this.soundscapePlaying) return;

      const flyOsc = ctx.createOscillator();
      const flyGain = ctx.createGain();
      const flyPanner = ctx.createStereoPanner();

      flyOsc.type = 'sawtooth';
      flyOsc.frequency.value = 250;

      // Fly buzz modulation
      const flyLfo = ctx.createOscillator();
      flyLfo.frequency.value = 30;
      flyLfo.start();

      const flyLfoGain = ctx.createGain();
      flyLfoGain.gain.value = 80;

      flyLfo.connect(flyLfoGain);
      flyLfoGain.connect(flyOsc.frequency);

      // Fly movement (quick panning)
      flyPanner.pan.setValueAtTime(-0.8, ctx.currentTime);
      flyPanner.pan.linearRampToValueAtTime(0.8, ctx.currentTime + 2);

      flyGain.gain.setValueAtTime(0, ctx.currentTime);
      flyGain.gain.linearRampToValueAtTime(0.003, ctx.currentTime + 0.3);
      flyGain.gain.linearRampToValueAtTime(0.003, ctx.currentTime + 1.5);
      flyGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);

      flyOsc.connect(flyGain);
      flyGain.connect(flyPanner);
      flyPanner.connect(masterGain);

      flyOsc.start();
      flyOsc.stop(ctx.currentTime + 2);

      setTimeout(() => {
        flyLfo.stop();
      }, 2000);

      setTimeout(fly, 15000 + Math.random() * 25000);
    };
    setTimeout(fly, 5000);

    // LAYER 6: Grasshopper chirps
    const grasshopper = () => {
      if (!this.soundscapePlaying) return;

      for (let i = 0; i < 2 + Math.random() * 3; i++) {
        setTimeout(() => {
          const chirp = ctx.createOscillator();
          const chirpGain = ctx.createGain();

          chirp.type = 'triangle';
          chirp.frequency.value = 3500 + Math.random() * 1000;

          chirpGain.gain.setValueAtTime(0, ctx.currentTime);
          chirpGain.gain.linearRampToValueAtTime(0.005, ctx.currentTime + 0.02);
          chirpGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

          chirp.connect(chirpGain);
          chirpGain.connect(masterGain);

          chirp.start();
          chirp.stop(ctx.currentTime + 0.08);
        }, i * 150);
      }

      setTimeout(grasshopper, 12000 + Math.random() * 18000);
    };
    setTimeout(grasshopper, 3000);

    // LAYER 7: Katydids (rhythmic "katy-did" pattern)
    const katydid = () => {
      if (!this.soundscapePlaying) return;

      // "Ka-ty-did" pattern
      [0, 200, 400].forEach((delay, i) => {
        setTimeout(() => {
          const katy = ctx.createOscillator();
          const katyGain = ctx.createGain();

          katy.type = 'square';
          katy.frequency.value = 2200 + i * 100;

          katyGain.gain.setValueAtTime(0, ctx.currentTime);
          katyGain.gain.linearRampToValueAtTime(0.004, ctx.currentTime + 0.03);
          katyGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

          katy.connect(katyGain);
          katyGain.connect(masterGain);

          katy.start();
          katy.stop(ctx.currentTime + 0.1);
        }, delay);
      });

      setTimeout(katydid, 20000 + Math.random() * 20000);
    };
    setTimeout(katydid, 8000);

    this.currentSoundscapeNodes.push(
      bee, beeGain, beeLfo, beeLfoGain, beePanner, beePanLfo, beePanGain,
      cicada, cicadaGain, cicadaLfo, cicadaLfoGain,
      mosquito, mosquitoGain, mosquitoLfo, mosquitoLfoGain, mosquitoPanner
    );
  }

  private addWoodpecker(ctx: AudioContext, masterGain: GainNode) {
    const peck = () => {
      if (!this.soundscapePlaying) return;

      const pecks = 5 + Math.floor(Math.random() * 8);
      for (let i = 0; i < pecks; i++) {
        setTimeout(() => {
          const knock = ctx.createOscillator();
          const knockGain = ctx.createGain();

          knock.type = 'sine';
          knock.frequency.value = 180;

          knockGain.gain.setValueAtTime(0.04, ctx.currentTime);
          knockGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

          knock.connect(knockGain);
          knockGain.connect(masterGain);

          knock.start();
          knock.stop(ctx.currentTime + 0.02);
        }, i * 100);
      }

      setTimeout(peck, 30000 + Math.random() * 60000);
    };

    setTimeout(peck, Math.random() * 20000);
  }

  private addOwlHoots(ctx: AudioContext, masterGain: GainNode) {
    const hoot = () => {
      if (!this.soundscapePlaying) return;

      // "Hoo-hoo" pattern
      [0, 800].forEach((delay, i) => {
        setTimeout(() => {
          const owl = ctx.createOscillator();
          const owlGain = ctx.createGain();

          owl.type = 'sine';
          owl.frequency.setValueAtTime(300, ctx.currentTime);
          owl.frequency.exponentialRampToValueAtTime(250, ctx.currentTime + 0.4);

          owlGain.gain.setValueAtTime(0, ctx.currentTime);
          owlGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.1);
          owlGain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.3);
          owlGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

          owl.connect(owlGain);
          owlGain.connect(masterGain);

          owl.start();
          owl.stop(ctx.currentTime + 0.5);
        }, delay);
      });

      setTimeout(hoot, 45000 + Math.random() * 60000);
    };

    setTimeout(hoot, 5000);
  }

  private addSmallAnimalSounds(ctx: AudioContext, masterGain: GainNode) {
    const scurry = () => {
      if (!this.soundscapePlaying) return;

      // Quick rustling sound
      const rustle = ctx.createBufferSource();
      const rustleBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const rustleData = rustleBuffer.getChannelData(0);

      for (let i = 0; i < rustleData.length; i++) {
        rustleData[i] = (Math.random() - 0.5) * 0.1 * Math.exp(-i / ctx.sampleRate * 10);
      }

      rustle.buffer = rustleBuffer;

      const rustleFilter = ctx.createBiquadFilter();
      rustleFilter.type = 'highpass';
      rustleFilter.frequency.value = 2000;

      const rustleGain = ctx.createGain();
      rustleGain.gain.value = 0.08;

      rustle.connect(rustleFilter);
      rustleFilter.connect(rustleGain);
      rustleGain.connect(masterGain);

      rustle.start();

      setTimeout(scurry, 25000 + Math.random() * 35000);
    };

    setTimeout(scurry, 10000 + Math.random() * 15000);
  }

  private addDistantPredator(ctx: AudioContext, masterGain: GainNode) {
    const howl = () => {
      if (!this.soundscapePlaying) return;

      const wolf = ctx.createOscillator();
      const wolfGain = ctx.createGain();
      const wolfFilter = ctx.createBiquadFilter();

      wolf.type = 'sawtooth';
      wolf.frequency.setValueAtTime(200, ctx.currentTime);
      wolf.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 1);
      wolf.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 2);
      wolf.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 3);

      wolfFilter.type = 'lowpass';
      wolfFilter.frequency.value = 800;
      wolfFilter.Q.value = 2;

      wolfGain.gain.setValueAtTime(0, ctx.currentTime);
      wolfGain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.5);
      wolfGain.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 2);
      wolfGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.5);

      wolf.connect(wolfFilter);
      wolfFilter.connect(wolfGain);
      wolfGain.connect(masterGain);

      wolf.start();
      wolf.stop(ctx.currentTime + 4);

      // Very rare
      setTimeout(howl, 120000 + Math.random() * 180000);
    };

    setTimeout(howl, Math.random() * 60000);
  }

  private createMountainSoundscape(ctx: AudioContext) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.06, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // High altitude wind
    const windBuffer = ctx.createBuffer(1, ctx.sampleRate * 20, ctx.sampleRate);
    const windData = windBuffer.getChannelData(0);

    for (let i = 0; i < windData.length; i++) {
      const t = i / ctx.sampleRate;
      windData[i] = (Math.random() - 0.5) * 0.4 * (1 + Math.sin(t * 0.1));
    }

    const windSource = ctx.createBufferSource();
    windSource.buffer = windBuffer;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 600;
    windFilter.Q.value = 1.5;

    windSource.connect(windFilter);
    windFilter.connect(masterGain);
    windSource.start();

    this.currentSoundscapeNodes.push(windSource, windFilter, masterGain);
  }

  private createDesertSoundscape(ctx: AudioContext) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.04, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Subtle wind with sand
    const sandBuffer = ctx.createBuffer(1, ctx.sampleRate * 25, ctx.sampleRate);
    const sandData = sandBuffer.getChannelData(0);

    for (let i = 0; i < sandData.length; i++) {
      sandData[i] = (Math.random() - 0.5) * 0.15 * Math.sin(i * 0.002);
    }

    const sandSource = ctx.createBufferSource();
    sandSource.buffer = sandBuffer;
    sandSource.loop = true;

    const sandFilter = ctx.createBiquadFilter();
    sandFilter.type = 'highpass';
    sandFilter.frequency.value = 2000;

    sandSource.connect(sandFilter);
    sandFilter.connect(masterGain);
    sandSource.start();

    this.currentSoundscapeNodes.push(sandSource, sandFilter, masterGain);
  }

  private createGrasslandSoundscape(ctx: AudioContext) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.05, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Wind through grass - FIXED timing
    this.createGentleWindFixed(ctx, masterGain);

    // Occasional cricket chirps - FIXED timing
    setTimeout(() => this.addCricketChirpsFixed(ctx, masterGain), 2000);

    this.currentSoundscapeNodes.push(masterGain);
  }

  private createWetlandsSoundscape(ctx: AudioContext) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.07, ctx.currentTime);
    masterGain.connect(ctx.destination);

    // Combination of water and swamp sounds
    this.createRiverSoundscape(ctx);
    this.addOccasionalBirdCall(ctx, masterGain);

    // Add croaking sounds
    setTimeout(() => this.addFrogCroaks(ctx, masterGain), 3000);

    this.currentSoundscapeNodes.push(masterGain);
  }

  private createCaveSoundscape(ctx: AudioContext) {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.15, ctx.currentTime); // Much more prominent
    masterGain.connect(ctx.destination);

    // LAYER 1: Deep cave resonance - low frequency rumble
    const resonanceBuffer = ctx.createBuffer(1, ctx.sampleRate * 60, ctx.sampleRate);
    const resonanceData = resonanceBuffer.getChannelData(0);

    for (let i = 0; i < resonanceData.length; i++) {
      const time = i / ctx.sampleRate;
      const lowRumble = Math.sin(time * 0.2) * 0.04; // Very slow, deep resonance
      const mediumRumble = Math.sin(time * 0.8) * 0.02; // Medium frequency
      const variation = (Math.random() - 0.5) * 0.01; // Random variation
      resonanceData[i] = lowRumble + mediumRumble + variation;
    }

    const resonanceSource = ctx.createBufferSource();
    resonanceSource.buffer = resonanceBuffer;
    resonanceSource.loop = true;

    const resonanceFilter = ctx.createBiquadFilter();
    resonanceFilter.type = 'lowpass';
    resonanceFilter.frequency.value = 120; // Very low frequencies
    resonanceFilter.Q.value = 2;

    resonanceSource.connect(resonanceFilter);
    resonanceFilter.connect(masterGain);
    resonanceSource.start();

    // LAYER 2: Water drips with realistic reverb
    this.createCaveWaterDrops(ctx, masterGain);

    // LAYER 3: Air movement through passages
    this.createCaveAirFlow(ctx, masterGain);

    // LAYER 4: Subtle stone settling/creaking
    this.createCaveSettling(ctx, masterGain);

    // LAYER 5: Distant echo ambience
    this.createCaveEchoAmbience(ctx, masterGain);

    // LAYER 6: Underground water flow (distant stream)
    this.createDistantUndergroundStream(ctx, masterGain);

    this.currentSoundscapeNodes.push(resonanceSource, resonanceFilter, masterGain);
  }

  private createCaveWaterDrops(ctx: AudioContext, masterGain: GainNode) {
    // Realistic water drops with varying timing and pitch
    const scheduleNextDrop = () => {
      if (!this.soundscapePlaying) return;

      const dropTime = ctx.currentTime + Math.random() * 3 + 1; // 1-4 seconds apart

      // Main drop sound
      const dropOsc = ctx.createOscillator();
      const dropGain = ctx.createGain();
      const dropFilter = ctx.createBiquadFilter();

      dropOsc.connect(dropFilter);
      dropFilter.connect(dropGain);
      dropGain.connect(masterGain);

      // Pitch varies for different drop sizes
      const dropPitch = 800 + Math.random() * 400; // 800-1200 Hz
      dropOsc.frequency.setValueAtTime(dropPitch, dropTime);
      dropOsc.frequency.exponentialRampToValueAtTime(dropPitch * 0.3, dropTime + 0.05);

      dropFilter.type = 'bandpass';
      dropFilter.frequency.value = dropPitch;
      dropFilter.Q.value = 5;

      dropGain.gain.setValueAtTime(0, dropTime);
      dropGain.gain.linearRampToValueAtTime(0.08, dropTime + 0.01);
      dropGain.gain.exponentialRampToValueAtTime(0.001, dropTime + 0.3);

      dropOsc.start(dropTime);
      dropOsc.stop(dropTime + 0.3);

      // Echo of the drop
      setTimeout(() => {
        if (!this.soundscapePlaying) return;

        const echoOsc = ctx.createOscillator();
        const echoGain = ctx.createGain();
        const echoFilter = ctx.createBiquadFilter();

        echoOsc.connect(echoFilter);
        echoFilter.connect(echoGain);
        echoGain.connect(masterGain);

        echoOsc.frequency.value = dropPitch * 0.7;
        echoFilter.type = 'lowpass';
        echoFilter.frequency.value = 600;

        const echoStartTime = ctx.currentTime;
        echoGain.gain.setValueAtTime(0, echoStartTime);
        echoGain.gain.linearRampToValueAtTime(0.03, echoStartTime + 0.01);
        echoGain.gain.exponentialRampToValueAtTime(0.001, echoStartTime + 0.5);

        echoOsc.start(echoStartTime);
        echoOsc.stop(echoStartTime + 0.5);
      }, 200 + Math.random() * 100); // Echo delay varies

      // Schedule next drop
      setTimeout(scheduleNextDrop, 1000 + Math.random() * 2000);
    };

    scheduleNextDrop();
  }

  private createCaveAirFlow(ctx: AudioContext, masterGain: GainNode) {
    const airBuffer = ctx.createBuffer(1, ctx.sampleRate * 45, ctx.sampleRate);
    const airData = airBuffer.getChannelData(0);

    for (let i = 0; i < airData.length; i++) {
      const time = i / ctx.sampleRate;
      const mainFlow = Math.sin(time * 0.1) * 0.03; // Very slow air movement
      const gusts = Math.sin(time * 0.7) * 0.01 * Math.sin(time * 0.05); // Occasional gusts
      const turbulence = (Math.random() - 0.5) * 0.005; // Subtle turbulence
      airData[i] = mainFlow + gusts + turbulence;
    }

    const airSource = ctx.createBufferSource();
    airSource.buffer = airBuffer;
    airSource.loop = true;

    const airFilter = ctx.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.frequency.value = 200;
    airFilter.Q.value = 1;

    airSource.connect(airFilter);
    airFilter.connect(masterGain);
    airSource.start();

    this.currentSoundscapeNodes.push(airSource, airFilter);
  }

  private createCaveSettling(ctx: AudioContext, masterGain: GainNode) {
    // Random stone settling sounds
    const scheduleSettling = () => {
      if (!this.soundscapePlaying) return;

      // Very occasional settling sounds
      const nextSettling = Math.random() * 15000 + 10000; // 10-25 seconds apart

      setTimeout(() => {
        if (!this.soundscapePlaying) return;

        const settlingOsc = ctx.createOscillator();
        const settlingGain = ctx.createGain();
        const settlingFilter = ctx.createBiquadFilter();

        settlingOsc.connect(settlingFilter);
        settlingFilter.connect(settlingGain);
        settlingGain.connect(masterGain);

        const settlingFreq = 80 + Math.random() * 120; // Low frequency stone sounds
        settlingOsc.frequency.value = settlingFreq;
        settlingOsc.type = 'triangle';

        settlingFilter.type = 'lowpass';
        settlingFilter.frequency.value = 300;
        settlingFilter.Q.value = 2;

        const startTime = ctx.currentTime;
        settlingGain.gain.setValueAtTime(0, startTime);
        settlingGain.gain.linearRampToValueAtTime(0.02, startTime + 0.1);
        settlingGain.gain.setValueAtTime(0.02, startTime + 0.3);
        settlingGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.5);

        settlingOsc.start(startTime);
        settlingOsc.stop(startTime + 1.5);

        scheduleSettling();
      }, nextSettling);
    };

    scheduleSettling();
  }

  private createCaveEchoAmbience(ctx: AudioContext, masterGain: GainNode) {
    const ambienceBuffer = ctx.createBuffer(1, ctx.sampleRate * 90, ctx.sampleRate);
    const ambienceData = ambienceBuffer.getChannelData(0);

    for (let i = 0; i < ambienceData.length; i++) {
      const time = i / ctx.sampleRate;

      // Layered ambient textures
      let sample = 0;

      // Very low frequency cave "breathing"
      sample += Math.sin(time * 0.05) * 0.02;

      // Mid-frequency atmospheric presence
      sample += Math.sin(time * 0.3) * 0.01 * Math.sin(time * 0.02);

      // Subtle random textures
      if (Math.random() < 0.0002) {
        sample += (Math.random() - 0.5) * 0.03;
      }

      // Very quiet random noise base
      sample += (Math.random() - 0.5) * 0.008;

      ambienceData[i] = sample;
    }

    const ambienceSource = ctx.createBufferSource();
    ambienceSource.buffer = ambienceBuffer;
    ambienceSource.loop = true;

    const ambienceFilter = ctx.createBiquadFilter();
    ambienceFilter.type = 'lowpass';
    ambienceFilter.frequency.value = 400;
    ambienceFilter.Q.value = 1;

    ambienceSource.connect(ambienceFilter);
    ambienceFilter.connect(masterGain);
    ambienceSource.start();

    this.currentSoundscapeNodes.push(ambienceSource, ambienceFilter);
  }

  private createDistantUndergroundStream(ctx: AudioContext, masterGain: GainNode) {
    const streamBuffer = ctx.createBuffer(1, ctx.sampleRate * 50, ctx.sampleRate);
    const streamData = streamBuffer.getChannelData(0);

    for (let i = 0; i < streamData.length; i++) {
      const time = i / ctx.sampleRate;

      // Distant water flow
      const mainFlow = Math.sin(time * 1.2) * 0.015; // Consistent flow
      const ripples = Math.sin(time * 4.5) * 0.005; // Water surface movement
      const bubbles = Math.random() < 0.0003 ? (Math.random() - 0.5) * 0.02 : 0; // Occasional bubbles

      streamData[i] = mainFlow + ripples + bubbles;
    }

    const streamSource = ctx.createBufferSource();
    streamSource.buffer = streamBuffer;
    streamSource.loop = true;

    const streamFilter = ctx.createBiquadFilter();
    streamFilter.type = 'bandpass';
    streamFilter.frequency.value = 350;
    streamFilter.Q.value = 2;

    // Very quiet - should be barely audible but add depth
    const streamGain = ctx.createGain();
    streamGain.gain.value = 0.3;

    streamSource.connect(streamFilter);
    streamFilter.connect(streamGain);
    streamGain.connect(masterGain);
    streamSource.start();

    this.currentSoundscapeNodes.push(streamSource, streamFilter, streamGain);
  }

  private createGentleWind(ctx: AudioContext, masterGain: GainNode) {
    const windBuffer = ctx.createBuffer(1, ctx.sampleRate * 18, ctx.sampleRate);
    const windData = windBuffer.getChannelData(0);

    for (let i = 0; i < windData.length; i++) {
      windData[i] = (Math.random() - 0.5) * 0.2 * Math.sin(i * 0.001);
    }

    const windSource = ctx.createBufferSource();
    windSource.buffer = windBuffer;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 600;

    windSource.connect(windFilter);
    windFilter.connect(masterGain);
    windSource.start();

    this.currentSoundscapeNodes.push(windSource, windFilter);
  }

  private createGentleWindFixed(ctx: AudioContext, masterGain: GainNode) {
    // Create much longer, smoother wind buffer
    const windBuffer = ctx.createBuffer(1, ctx.sampleRate * 45, ctx.sampleRate);
    const windData = windBuffer.getChannelData(0);

    for (let i = 0; i < windData.length; i++) {
      // Create smooth, natural wind sound with very slow modulation
      const time = i / ctx.sampleRate;
      const baseNoise = (Math.random() - 0.5) * 0.08; // Much quieter base noise
      const slowWave = Math.sin(time * 0.05) * 0.04; // Very slow gusts
      const microWave = Math.sin(time * 0.3) * 0.02; // Slight texture
      windData[i] = baseNoise + slowWave + microWave;
    }

    const windSource = ctx.createBufferSource();
    windSource.buffer = windBuffer;
    windSource.loop = true;

    const windFilter = ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.value = 400; // Lower for more natural wind
    windFilter.Q.value = 0.5;

    windSource.connect(windFilter);
    windFilter.connect(masterGain);
    windSource.start();

    this.currentSoundscapeNodes.push(windSource, windFilter);
  }

  private addOccasionalBirdCall(ctx: AudioContext, masterGain: GainNode) {
    const birdCall = () => {
      if (!this.soundscapePlaying) return;

      const birdOsc = ctx.createOscillator();
      const birdGain = ctx.createGain();

      birdOsc.connect(birdGain);
      birdGain.connect(masterGain);

      birdOsc.type = 'sine';
      birdOsc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
      birdOsc.frequency.exponentialRampToValueAtTime(1200 + Math.random() * 600, ctx.currentTime + 0.3);

      birdGain.gain.setValueAtTime(0, ctx.currentTime);
      birdGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      birdGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      birdOsc.start();
      birdOsc.stop(ctx.currentTime + 0.4);

      setTimeout(birdCall, 8000 + Math.random() * 12000);
    };

    setTimeout(birdCall, 3000 + Math.random() * 5000);
  }

  private addCricketChirps(ctx: AudioContext, masterGain: GainNode) {
    const cricketChirp = () => {
      if (!this.soundscapePlaying) return;

      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const cricket = ctx.createOscillator();
          const cricketGain = ctx.createGain();

          cricket.connect(cricketGain);
          cricketGain.connect(masterGain);

          cricket.type = 'triangle';
          cricket.frequency.value = 3000 + Math.random() * 1000;

          cricketGain.gain.setValueAtTime(0, ctx.currentTime);
          cricketGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.01);
          cricketGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

          cricket.start();
          cricket.stop(ctx.currentTime + 0.1);
        }, i * 100);
      }

      setTimeout(cricketChirp, 5000 + Math.random() * 8000);
    };

    setTimeout(cricketChirp, 2000);
  }

  private addCricketChirpsFixed(ctx: AudioContext, masterGain: GainNode) {
    const cricketChirp = () => {
      if (!this.soundscapePlaying) return;

      // Create cricket sequence with much better timing
      for (let i = 0; i < 2 + Math.random() * 3; i++) {
        setTimeout(() => {
          const cricket = ctx.createOscillator();
          const cricketGain = ctx.createGain();

          cricket.connect(cricketGain);
          cricketGain.connect(masterGain);

          cricket.type = 'triangle';
          cricket.frequency.value = 2800 + Math.random() * 800; // Slightly lower pitch

          cricketGain.gain.setValueAtTime(0, ctx.currentTime);
          cricketGain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 0.02); // Quieter and slower attack
          cricketGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

          cricket.start();
          cricket.stop(ctx.currentTime + 0.15);
        }, i * 150 + Math.random() * 100); // More spacing between chirps
      }

      // Much longer delays between cricket sequences
      setTimeout(cricketChirp, 12000 + Math.random() * 18000); // 12-30 seconds between sequences
    };

    setTimeout(cricketChirp, 5000 + Math.random() * 10000); // Initial delay
  }

  private addFrogCroaks(ctx: AudioContext, masterGain: GainNode) {
    const frogCroak = () => {
      if (!this.soundscapePlaying) return;

      const frog = ctx.createOscillator();
      const frogGain = ctx.createGain();

      frog.connect(frogGain);
      frogGain.connect(masterGain);

      frog.type = 'sawtooth';
      frog.frequency.setValueAtTime(120 + Math.random() * 80, ctx.currentTime);
      frog.frequency.exponentialRampToValueAtTime(80 + Math.random() * 40, ctx.currentTime + 0.3);

      frogGain.gain.setValueAtTime(0, ctx.currentTime);
      frogGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
      frogGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      frog.start();
      frog.stop(ctx.currentTime + 0.4);

      setTimeout(frogCroak, 6000 + Math.random() * 10000);
    };

    setTimeout(frogCroak, 4000);
  }

  private addWeatherOverlay(ctx: AudioContext, weatherConditions: string) {
    if (weatherConditions.includes('rain')) {
      this.playRainSound();
    }
    if (weatherConditions.includes('wind')) {
      // Enhance existing wind sounds
      const windGain = ctx.createGain();
      windGain.gain.setValueAtTime(0.03, ctx.currentTime);
      windGain.connect(ctx.destination);
      this.currentSoundscapeNodes.push(windGain);
    }
  }

  public stopEnvironmentalSoundscape() {
    this.soundscapePlaying = false;
    this.currentSoundscapeNodes.forEach(node => {
      try {
        if ('stop' in node) {
          (node as AudioBufferSourceNode | OscillatorNode).stop();
        } else if ('disconnect' in node) {
          node.disconnect();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.currentSoundscapeNodes = [];
  }

  /**
   * ANIMAL SOUND - Goat bleat
   */
  public playGoatSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Goat bleat - higher pitched than sheep
      const bleat = ctx.createOscillator();
      const bleat2 = ctx.createOscillator();
      const bleatGain = ctx.createGain();
      const bleatFilter = ctx.createBiquadFilter();

      bleat.connect(bleatFilter);
      bleat2.connect(bleatFilter);
      bleatFilter.connect(bleatGain);
      bleatGain.connect(ctx.destination);

      bleat.type = 'sawtooth';
      bleat.frequency.setValueAtTime(250, now);
      bleat.frequency.linearRampToValueAtTime(300, now + 0.15);
      bleat.frequency.linearRampToValueAtTime(220, now + 0.3);

      // Higher harmonic for characteristic goat sound
      bleat2.type = 'square';
      bleat2.frequency.setValueAtTime(500, now);
      bleat2.frequency.linearRampToValueAtTime(600, now + 0.15);
      bleat2.frequency.linearRampToValueAtTime(440, now + 0.3);

      bleatFilter.type = 'bandpass';
      bleatFilter.frequency.value = 400;
      bleatFilter.Q.value = 3;

      bleatGain.gain.setValueAtTime(0, now);
      bleatGain.gain.linearRampToValueAtTime(0.15 * this.masterVolume, now + 0.05);
      bleatGain.gain.setValueAtTime(0.12 * this.masterVolume, now + 0.2);
      bleatGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      bleat.start(now);
      bleat.stop(now + 0.4);
      bleat2.start(now);
      bleat2.stop(now + 0.4);

    } catch (error) {
      console.error('Error playing goat sound:', error);
    }
  }

  /**
   * ANIMAL SOUND - Chicken cluck
   */
  public playChickenSound() {
    if (this.isMuted) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Chicken cluck - short, sharp bursts
      for (let i = 0; i < 3; i++) {
        const cluck = ctx.createOscillator();
        const cluckGain = ctx.createGain();
        const cluckFilter = ctx.createBiquadFilter();

        cluck.connect(cluckFilter);
        cluckFilter.connect(cluckGain);
        cluckGain.connect(ctx.destination);

        const startTime = now + i * 0.15;

        cluck.type = 'square';
        cluck.frequency.setValueAtTime(800 + Math.random() * 200, startTime);
        cluck.frequency.exponentialRampToValueAtTime(400, startTime + 0.08);

        cluckFilter.type = 'bandpass';
        cluckFilter.frequency.value = 1200;
        cluckFilter.Q.value = 5;

        cluckGain.gain.setValueAtTime(0, startTime);
        cluckGain.gain.linearRampToValueAtTime(0.1 * this.masterVolume, startTime + 0.01);
        cluckGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);

        cluck.start(startTime);
        cluck.stop(startTime + 0.08);
      }

    } catch (error) {
      console.error('Error playing chicken sound:', error);
    }
  }
}

// Export singleton instance
export const gameSounds = GameSoundsService.getInstance();

// Export for use in other files
export default gameSounds;