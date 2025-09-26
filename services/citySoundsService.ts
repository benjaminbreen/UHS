/**
 * CitySounds Service
 * Procedural sound effects for city environments and workshops
 * All sounds are generated programmatically using Web Audio API
 */

class CitySoundsService {
  private static instance: CitySoundsService;
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterVolume: number = 0.5;

  // Track playing sounds for cleanup
  private smithyNodes: AudioNode[] = [];
  private smithyPlaying = false;
  private potteryNodes: AudioNode[] = [];
  private potteryPlaying = false;
  private weavingNodes: AudioNode[] = [];
  private weavingPlaying = false;
  private bakeryNodes: AudioNode[] = [];
  private bakeryPlaying = false;
  private carpentryNodes: AudioNode[] = [];
  private carpentryPlaying = false;

  // Cultural workspace songs
  private japaneseWorkshopNodes: AudioNode[] = [];
  private japaneseWorkshopPlaying = false;
  private arabicWorkshopNodes: AudioNode[] = [];
  private arabicWorkshopPlaying = false;
  private medievalWorkshopNodes: AudioNode[] = [];
  private medievalWorkshopPlaying = false;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAudioContext();
    }
  }

  public static getInstance(): CitySoundsService {
    if (!CitySoundsService.instance) {
      CitySoundsService.instance = new CitySoundsService();
    }
    return CitySoundsService.instance;
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

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * SMITHY AMBIENT - Hammer strikes, bellows, fire crackling
   */
  public playSmithyAmbient() {
    if (this.isMuted || this.smithyPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.smithyPlaying = true;
      this.smithyNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 20; // 20-second loop

      // Master gain for all smithy sounds
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4 * this.masterVolume, now);
      masterGain.connect(ctx.destination);
      this.smithyNodes.push(masterGain);

      // Create anvil hammer strikes rhythm
      this.createAnvilStrikes(ctx, now, loopDuration, masterGain);

      // Add bellows pumping sound
      this.createBellowsSound(ctx, now, loopDuration, masterGain);

      // Add continuous forge fire crackling
      this.createForgeFire(ctx, now, loopDuration, masterGain);

      // Loop the ambient sounds
      const loopSmithy = () => {
        if (this.smithyPlaying) {
          setTimeout(() => {
            if (this.smithyPlaying) {
              this.smithyNodes = [masterGain];
              this.createAnvilStrikes(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createBellowsSound(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createForgeFire(ctx, ctx.currentTime, loopDuration, masterGain);
              loopSmithy();
            }
          }, loopDuration * 1000);
        }
      };
      loopSmithy();

    } catch (error) {
      console.error('Error playing smithy ambient:', error);
      this.smithyPlaying = false;
    }
  }

  private createAnvilStrikes(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Rhythmic hammer strikes on anvil
    const strikePattern = [3, 3.3, 15, 15.3]; // VERY sparse - only 4 strikes in 20 seconds

    strikePattern.forEach((time, index) => {
      if (time < duration) {
        // Metal impact sound
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Alternate between two specific pitches only
        osc.frequency.setValueAtTime(index % 2 === 0 ? 800 : 650, startTime + time);
        osc.type = 'sawtooth';

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000 + Math.random() * 1000, startTime + time);
        filter.Q.setValueAtTime(5, startTime + time);

        // Sharp attack, quick decay for metallic strike
        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.4, startTime + time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + time + 0.3);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime + time);
        osc.stop(startTime + time + 0.4);

        this.smithyNodes.push(osc, gain, filter);

        // Add metallic resonance
        const resonance = ctx.createOscillator();
        const resGain = ctx.createGain();

        resonance.frequency.setValueAtTime(3200 + Math.random() * 800, startTime + time);
        resonance.type = 'sine';

        resGain.gain.setValueAtTime(0.1, startTime + time);
        resGain.gain.exponentialRampToValueAtTime(0.001, startTime + time + 1.0);

        resonance.connect(resGain);
        resGain.connect(masterGain);

        resonance.start(startTime + time);
        resonance.stop(startTime + time + 1.5);

        this.smithyNodes.push(resonance, resGain);
      }
    });
  }

  private createBellowsSound(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Rhythmic air pumping sound
    const bellowsTimes = [8]; // Only ONE bellows sound every 20 seconds

    bellowsTimes.forEach(time => {
      if (time < duration) {
        // White noise for air sound
        const bufferSize = ctx.sampleRate * 1.5; // 1.5 second whoosh
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, startTime + time);
        filter.frequency.linearRampToValueAtTime(400, startTime + time + 1.5);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.15, startTime + time + 0.3);
        gain.gain.linearRampToValueAtTime(0.15, startTime + time + 0.8);
        gain.gain.linearRampToValueAtTime(0, startTime + time + 1.5);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(startTime + time);
        source.stop(startTime + time + 2);

        this.smithyNodes.push(source, filter, gain);
      }
    });
  }

  private createForgeFire(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Continuous crackling fire sound
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Create crackling noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.98 ? 1 : 0.3);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, startTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    source.start(startTime);
    source.stop(startTime + duration);

    this.smithyNodes.push(source, filter, gain);
  }

  public stopSmithyAmbient() {
    this.smithyPlaying = false;
    this.smithyNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
      } catch (e) {
        // Node may already be stopped
      }
    });
    this.smithyNodes = [];
  }

  /**
   * POTTERY WORKSHOP AMBIENT - Wheel spinning, clay shaping, kiln fire
   */
  public playPotteryAmbient() {
    if (this.isMuted || this.potteryPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.potteryPlaying = true;
      this.potteryNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 24;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.5 * this.masterVolume, now); // Much louder pottery
      masterGain.connect(ctx.destination);
      this.potteryNodes.push(masterGain);

      // Create pottery wheel spinning sound
      this.createPotteryWheelSound(ctx, now, loopDuration, masterGain);

      // Add clay manipulation sounds
      this.createClayShapingSounds(ctx, now, loopDuration, masterGain);

      // Add kiln ambient
      this.createKilnAmbient(ctx, now, loopDuration, masterGain);

      const loopPottery = () => {
        if (this.potteryPlaying) {
          setTimeout(() => {
            if (this.potteryPlaying) {
              this.potteryNodes = [masterGain];
              this.createPotteryWheelSound(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createClayShapingSounds(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createKilnAmbient(ctx, ctx.currentTime, loopDuration, masterGain);
              loopPottery();
            }
          }, loopDuration * 1000);
        }
      };
      loopPottery();

    } catch (error) {
      console.error('Error playing pottery ambient:', error);
      this.potteryPlaying = false;
    }
  }

  private createPotteryWheelSound(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Continuous low humming/spinning sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.frequency.setValueAtTime(60, startTime);
    osc.type = 'sine';

    // Add slight wobble to simulate uneven spinning
    const wobble = ctx.createOscillator();
    wobble.frequency.setValueAtTime(2, startTime);
    wobble.type = 'sine';
    const wobbleGain = ctx.createGain();
    wobbleGain.gain.setValueAtTime(3, startTime);
    wobble.connect(wobbleGain);
    wobbleGain.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, startTime);

    gain.gain.setValueAtTime(0.05, startTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
    wobble.start(startTime);
    wobble.stop(startTime + duration);

    this.potteryNodes.push(osc, gain, filter, wobble, wobbleGain);
  }

  private createClayShapingSounds(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Soft, wet squishing sounds at intervals
    const shapingTimes = [6, 18]; // Only TWO clay shaping sounds

    shapingTimes.forEach(time => {
      if (time < duration) {
        // Pink noise for wet clay sound
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          data[i] = pink * 0.11;
          b6 = white * 0.115926;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, startTime + time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.08, startTime + time + 0.1);
        gain.gain.linearRampToValueAtTime(0.08, startTime + time + 0.4);
        gain.gain.linearRampToValueAtTime(0, startTime + time + 0.8);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(startTime + time);
        source.stop(startTime + time + 1);

        this.potteryNodes.push(source, filter, gain);
      }
    });
  }

  private createKilnAmbient(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Low rumbling kiln fire
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, startTime); // Louder kiln

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    source.start(startTime);
    source.stop(startTime + duration);

    this.potteryNodes.push(source, filter, gain);
  }

  public stopPotteryAmbient() {
    this.potteryPlaying = false;
    this.potteryNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
      } catch (e) {}
    });
    this.potteryNodes = [];
  }

  /**
   * WEAVING WORKSHOP AMBIENT - Loom clacking, thread spinning, fabric rustling
   */
  public playWeavingAmbient() {
    if (this.isMuted || this.weavingPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.weavingPlaying = true;
      this.weavingNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 18;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.5 * this.masterVolume, now); // Much louder weaving
      masterGain.connect(ctx.destination);
      this.weavingNodes.push(masterGain);

      this.createLoomClacking(ctx, now, loopDuration, masterGain);
      this.createSpinningWheelSound(ctx, now, loopDuration, masterGain);
      this.createFabricRustling(ctx, now, loopDuration, masterGain);

      const loopWeaving = () => {
        if (this.weavingPlaying) {
          setTimeout(() => {
            if (this.weavingPlaying) {
              this.weavingNodes = [masterGain];
              this.createLoomClacking(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createSpinningWheelSound(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createFabricRustling(ctx, ctx.currentTime, loopDuration, masterGain);
              loopWeaving();
            }
          }, loopDuration * 1000);
        }
      };
      loopWeaving();

    } catch (error) {
      console.error('Error playing weaving ambient:', error);
      this.weavingPlaying = false;
    }
  }

  private createLoomClacking(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Rhythmic wooden clacking of the loom
    const clackPattern = [2, 2.6, 10, 10.6]; // Only 4 clacks in 18 seconds

    clackPattern.forEach(time => {
      if (time < duration) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.frequency.setValueAtTime(200 + Math.random() * 100, startTime + time);
        osc.type = 'square';

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, startTime + time);
        filter.Q.setValueAtTime(2, startTime + time);

        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.15, startTime + time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + time + 0.1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime + time);
        osc.stop(startTime + time + 0.2);

        this.weavingNodes.push(osc, gain, filter);
      }
    });
  }

  private createSpinningWheelSound(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Continuous spinning wheel whir
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.frequency.setValueAtTime(100, startTime);
    osc.type = 'triangle';

    // Add rhythmic modulation
    const modulator = ctx.createOscillator();
    modulator.frequency.setValueAtTime(4, startTime);
    modulator.type = 'sine';
    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(10, startTime);
    modulator.connect(modGain);
    modGain.connect(osc.frequency);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, startTime);

    gain.gain.setValueAtTime(0.03, startTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
    modulator.start(startTime);
    modulator.stop(startTime + duration);

    this.weavingNodes.push(osc, gain, filter, modulator, modGain);
  }

  private createFabricRustling(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Occasional fabric movement sounds
    const rustleTimes = [8]; // Only ONE fabric rustle

    rustleTimes.forEach(time => {
      if (time < duration) {
        const bufferSize = ctx.sampleRate * 1.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.sin(i / bufferSize * Math.PI);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, startTime + time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.05, startTime + time + 0.1);
        gain.gain.linearRampToValueAtTime(0.05, startTime + time + 0.5);
        gain.gain.linearRampToValueAtTime(0, startTime + time + 1.0);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(startTime + time);
        source.stop(startTime + time + 1.5);

        this.weavingNodes.push(source, filter, gain);
      }
    });
  }

  public stopWeavingAmbient() {
    this.weavingPlaying = false;
    this.weavingNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
      } catch (e) {}
    });
    this.weavingNodes = [];
  }

  /**
   * BAKERY AMBIENT - Oven fire, dough kneading, flour sifting
   */
  public playBakeryAmbient() {
    if (this.isMuted || this.bakeryPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.bakeryPlaying = true;
      this.bakeryNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 22;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4 * this.masterVolume, now); // Much louder bakery
      masterGain.connect(ctx.destination);
      this.bakeryNodes.push(masterGain);

      this.createOvenFire(ctx, now, loopDuration, masterGain);
      this.createDoughKneading(ctx, now, loopDuration, masterGain);
      this.createFlourSifting(ctx, now, loopDuration, masterGain);

      const loopBakery = () => {
        if (this.bakeryPlaying) {
          setTimeout(() => {
            if (this.bakeryPlaying) {
              this.bakeryNodes = [masterGain];
              this.createOvenFire(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createDoughKneading(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createFlourSifting(ctx, ctx.currentTime, loopDuration, masterGain);
              loopBakery();
            }
          }, loopDuration * 1000);
        }
      };
      loopBakery();

    } catch (error) {
      console.error('Error playing bakery ambient:', error);
      this.bakeryPlaying = false;
    }
  }

  private createOvenFire(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Warm crackling oven fire
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Gentle crackling
      data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.99 ? 0.8 : 0.2);
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.06, startTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    source.start(startTime);
    source.stop(startTime + duration);

    this.bakeryNodes.push(source, filter, gain);
  }

  private createDoughKneading(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Rhythmic thumping/slapping of dough
    const kneadPattern = [4, 4.4, 4.8, 16, 16.4, 16.8]; // Only 6 kneading sounds

    kneadPattern.forEach(time => {
      if (time < duration) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.frequency.setValueAtTime(80 + Math.random() * 40, startTime + time);
        osc.type = 'sine';

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, startTime + time);

        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.12, startTime + time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + time + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime + time);
        osc.stop(startTime + time + 0.3);

        this.bakeryNodes.push(osc, gain, filter);
      }
    });
  }

  private createFlourSifting(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Soft shaking/sifting sounds
    const siftTimes = [12]; // Only ONE sifting sound

    siftTimes.forEach(time => {
      if (time < duration) {
        const bufferSize = ctx.sampleRate * 2.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Create rhythmic shaking pattern
        for (let i = 0; i < bufferSize; i++) {
          const envelope = Math.sin((i / bufferSize) * Math.PI * 8) * Math.sin((i / bufferSize) * Math.PI);
          data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(3000, startTime + time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.04, startTime + time);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(startTime + time);
        source.stop(startTime + time + 2.5);

        this.bakeryNodes.push(source, filter, gain);
      }
    });
  }

  public stopBakeryAmbient() {
    this.bakeryPlaying = false;
    this.bakeryNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
      } catch (e) {}
    });
    this.bakeryNodes = [];
  }

  /**
   * CARPENTRY AMBIENT - Sawing, hammering, sanding
   */
  public playCarpentryAmbient() {
    if (this.isMuted || this.carpentryPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.carpentryPlaying = true;
      this.carpentryNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 25;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.4 * this.masterVolume, now); // Much louder carpentry
      masterGain.connect(ctx.destination);
      this.carpentryNodes.push(masterGain);

      this.createHammeringSound(ctx, now, loopDuration, masterGain);
      this.createSandingSound(ctx, now, loopDuration, masterGain);

      const loopCarpentry = () => {
        if (this.carpentryPlaying) {
          setTimeout(() => {
            if (this.carpentryPlaying) {
              this.carpentryNodes = [masterGain];
              this.createHammeringSound(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createSandingSound(ctx, ctx.currentTime, loopDuration, masterGain);
              loopCarpentry();
            }
          }, loopDuration * 1000);
        }
      };
      loopCarpentry();

    } catch (error) {
      console.error('Error playing carpentry ambient:', error);
      this.carpentryPlaying = false;
    }
  }

  private createSawingSound(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Back and forth sawing rhythm
    const sawTimes = [1, 5, 9, 13, 17, 21];

    sawTimes.forEach(time => {
      if (time < duration) {
        const sawDuration = 3.0;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Sawtooth wave for sawing
        osc.type = 'sawtooth';

        // Create rhythmic back-forth motion
        const sawSpeed = 3; // strokes per second
        for (let i = 0; i < sawDuration * sawSpeed; i++) {
          const strokeTime = startTime + time + (i / sawSpeed);
          if (i % 2 === 0) {
            // Forward stroke
            osc.frequency.linearRampToValueAtTime(300, strokeTime);
            osc.frequency.linearRampToValueAtTime(150, strokeTime + 0.3);
          } else {
            // Back stroke
            osc.frequency.linearRampToValueAtTime(200, strokeTime);
            osc.frequency.linearRampToValueAtTime(100, strokeTime + 0.3);
          }
        }

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(400, startTime + time);
        filter.Q.setValueAtTime(1, startTime + time);

        gain.gain.setValueAtTime(0.08, startTime + time);
        gain.gain.setValueAtTime(0.08, startTime + time + sawDuration - 0.2);
        gain.gain.linearRampToValueAtTime(0, startTime + time + sawDuration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime + time);
        osc.stop(startTime + time + sawDuration);

        this.carpentryNodes.push(osc, gain, filter);
      }
    });
  }

  private createHammeringSound(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Nail hammering pattern
    const hammerPattern = [8, 8.3, 8.6]; // Only 3 hammer hits

    hammerPattern.forEach(time => {
      if (time < duration) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.frequency.setValueAtTime(120 + Math.random() * 60, startTime + time);
        osc.type = 'triangle';

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(250, startTime + time);
        filter.Q.setValueAtTime(3, startTime + time);

        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.2, startTime + time + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + time + 0.15);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime + time);
        osc.stop(startTime + time + 0.2);

        this.carpentryNodes.push(osc, gain, filter);
      }
    });
  }

  private createSandingSound(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Rhythmic sanding/scraping
    const sandTimes = [18]; // Only ONE sanding sound

    sandTimes.forEach(time => {
      if (time < duration) {
        const bufferSize = ctx.sampleRate * 2.0;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Create scraping texture
        for (let i = 0; i < bufferSize; i++) {
          const scrapePattern = Math.sin((i / bufferSize) * Math.PI * 6);
          data[i] = (Math.random() * 2 - 1) * scrapePattern * 0.7;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, startTime + time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, startTime + time);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(startTime + time);
        source.stop(startTime + time + 2.5);

        this.carpentryNodes.push(source, filter, gain);
      }
    });
  }

  public stopCarpentryAmbient() {
    this.carpentryPlaying = false;
    this.carpentryNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
      } catch (e) {}
    });
    this.carpentryNodes = [];
  }

  /**
   * JAPANESE WORKSHOP SONG - Peaceful, pentatonic melody with koto and shakuhachi inspiration
   */
  public playJapaneseWorkshopMusic() {
    if (this.isMuted || this.japaneseWorkshopPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.japaneseWorkshopPlaying = true;
      this.japaneseWorkshopNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 48; // Longer, slower

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.6 * this.masterVolume, now + 3); // Slower fade-in
      masterGain.connect(ctx.destination);
      this.japaneseWorkshopNodes.push(masterGain);

      // Simple Japanese layers like fishing music
      this.createJapaneseMelody(ctx, now, loopDuration, masterGain);
      this.createJapaneseChords(ctx, now, loopDuration, masterGain);
      this.createJapaneseArpeggio(ctx, now, loopDuration, masterGain);

      const loopJapanese = () => {
        if (this.japaneseWorkshopPlaying) {
          setTimeout(() => {
            if (this.japaneseWorkshopPlaying) {
              this.japaneseWorkshopNodes = [masterGain];
              this.createJapaneseMelody(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createJapaneseChords(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createJapaneseArpeggio(ctx, ctx.currentTime, loopDuration, masterGain);
              loopJapanese();
            }
          }, loopDuration * 1000);
        }
      };
      loopJapanese();

    } catch (error) {
      console.error('Error playing Japanese workshop music:', error);
      this.japaneseWorkshopPlaying = false;
    }
  }

  private createJapaneseMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Japanese pentatonic scale (A minor pentatonic: A C D E G)
    const melody = [
      { note: 440, time: 0, dur: 1.0 },      // A4
      { note: 523.25, time: 1.2, dur: 0.8 }, // C5
      { note: 587.33, time: 2.2, dur: 1.0 }, // D5
      { note: 523.25, time: 3.4, dur: 0.6 }, // C5
      { note: 440, time: 4.2, dur: 1.2 },    // A4

      { note: 392, time: 5.6, dur: 1.0 },    // G4
      { note: 329.63, time: 6.8, dur: 1.2 }, // E4
      { note: 392, time: 8.2, dur: 0.8 },    // G4
      { note: 440, time: 9.2, dur: 1.4 },    // A4

      { note: 659.25, time: 11.0, dur: 1.0 }, // E5
      { note: 587.33, time: 12.2, dur: 0.8 }, // D5
      { note: 523.25, time: 13.2, dur: 1.0 }, // C5
      { note: 587.33, time: 14.4, dur: 0.8 }, // D5
      { note: 659.25, time: 15.4, dur: 1.2 }, // E5

      { note: 783.99, time: 17.0, dur: 2.0 }, // G5
      { note: 659.25, time: 19.2, dur: 0.8 }, // E5
      { note: 587.33, time: 20.2, dur: 1.0 }, // D5
      { note: 523.25, time: 21.4, dur: 1.2 }, // C5

      { note: 440, time: 23.0, dur: 1.0 },    // A4
      { note: 523.25, time: 24.2, dur: 0.8 }, // C5
      { note: 587.33, time: 25.2, dur: 1.0 }, // D5
      { note: 659.25, time: 26.4, dur: 0.8 }, // E5
      { note: 587.33, time: 27.4, dur: 1.0 }, // D5
      { note: 523.25, time: 28.6, dur: 0.8 }, // C5
      { note: 440, time: 29.6, dur: 2.4 },    // A4
    ];

    melody.forEach(({ note, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.frequency.setValueAtTime(note, startTime + time);
      osc.type = 'sine';

      // Add slight vibrato
      const vibrato = ctx.createOscillator();
      vibrato.frequency.setValueAtTime(4, startTime + time);
      vibrato.type = 'sine';
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.setValueAtTime(note * 0.1, startTime + time);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, startTime + time);

      gain.gain.setValueAtTime(0, startTime + time);
      gain.gain.linearRampToValueAtTime(0.08, startTime + time + 0.05);
      gain.gain.setValueAtTime(0.08, startTime + time + dur - 0.1);
      gain.gain.linearRampToValueAtTime(0, startTime + time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime + time);
      osc.stop(startTime + time + dur + 0.1);
      vibrato.start(startTime + time);
      vibrato.stop(startTime + time + dur + 0.1);

      this.japaneseWorkshopNodes.push(osc, gain, filter, vibrato, vibratoGain);
    });
  }

  private createKotoArpeggio(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Koto-style plucked arpeggios
    const arpeggioNotes = [
      220, 261.63, 293.66, 329.63, 392, // A3, C4, D4, E4, G4
      329.63, 293.66, 261.63, 220,       // Back down
    ];

    const arpeggioSpeed = 0.8;

    for (let measure = 0; measure < duration / 4; measure++) {
      arpeggioNotes.forEach((note, index) => {
        const time = measure * 4 + index * arpeggioSpeed;
        if (time < duration) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.frequency.setValueAtTime(note, startTime + time);
          osc.type = 'triangle';

          filter.type = 'highpass';
          filter.frequency.setValueAtTime(200, startTime + time);

          // Sharp pluck envelope
          gain.gain.setValueAtTime(0.06, startTime + time);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + time + 0.5);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime + time);
          osc.stop(startTime + time + 0.6);

          this.japaneseWorkshopNodes.push(osc, gain, filter);
        }
      });
    }
  }

  private createShakuhachiDrone(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Breathy flute-like drone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.frequency.setValueAtTime(220, startTime); // A3 drone
    osc.type = 'sine';

    // Add breath noise
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.02;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(2000, startTime);
    noiseFilter.Q.setValueAtTime(2, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, startTime);

    gain.gain.setValueAtTime(0.03, startTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(gain);

    osc.start(startTime);
    osc.stop(startTime + duration);
    noiseSource.start(startTime);
    noiseSource.stop(startTime + duration);

    this.japaneseWorkshopNodes.push(osc, gain, filter, noiseSource, noiseFilter);
  }

  private createJapaneseBass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Simple bass line
    const bassNotes = [
      { note: 110, time: 0, dur: 4 },      // A2
      { note: 130.81, time: 4, dur: 4 },   // C3
      { note: 110, time: 8, dur: 4 },      // A2
      { note: 98, time: 12, dur: 4 },      // G2
      { note: 110, time: 16, dur: 4 },     // A2
      { note: 146.83, time: 20, dur: 4 },  // D3
      { note: 110, time: 24, dur: 4 },     // A2
      { note: 82.41, time: 28, dur: 4 },   // E2
    ];

    bassNotes.forEach(({ note, time, dur }) => {
      if (time < duration) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(note, startTime + time);
        osc.type = 'sine';

        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.06, startTime + time + 0.1);
        gain.gain.setValueAtTime(0.06, startTime + time + dur - 0.2);
        gain.gain.linearRampToValueAtTime(0, startTime + time + dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime + time);
        osc.stop(startTime + time + dur + 0.1);

        this.japaneseWorkshopNodes.push(osc, gain);
      }
    });
  }

  public stopJapaneseWorkshopMusic() {
    this.japaneseWorkshopPlaying = false;
    this.japaneseWorkshopNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
      } catch (e) {}
    });
    this.japaneseWorkshopNodes = [];
  }

  /**
   * ARABIC WORKSHOP SONG - Middle Eastern scales with oud and percussion inspiration
   */
  public playArabicWorkshopMusic() {
    // Use Japanese workshop music for all workshops
    this.playJapaneseWorkshopMusic();
  }


  private createOudStrumming(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Rhythmic oud strumming pattern
    const strumPattern = [0, 0.5, 0.75, 1.5, 2, 2.5, 2.75, 3.5];
    const chords = [
      [164.81, 207.65, 246.94], // E3, G#3, B3
      [174.61, 220, 261.63],     // F3, A3, C4
      [164.81, 207.65, 246.94], // E3, G#3, B3
      [146.83, 185, 220],        // D3, F#3, A3
    ];

    for (let measure = 0; measure < duration / 4; measure++) {
      const chord = chords[measure % chords.length];

      strumPattern.forEach(beat => {
        const time = measure * 4 + beat;
        if (time < duration) {
          chord.forEach((note, index) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.frequency.setValueAtTime(note, startTime + time);
            osc.type = 'sawtooth';

            // Strum delay
            const strumDelay = index * 0.01;

            gain.gain.setValueAtTime(0, startTime + time + strumDelay);
            gain.gain.linearRampToValueAtTime(0.04, startTime + time + strumDelay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + time + strumDelay + 0.3);

            osc.connect(gain);
            gain.connect(masterGain);

            osc.start(startTime + time + strumDelay);
            osc.stop(startTime + time + strumDelay + 0.4);

            this.arabicWorkshopNodes.push(osc, gain);
          });
        }
      });
    }
  }

  private createDarbukarhythm(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Darbuka (goblet drum) rhythm - Maqsoum pattern
    const pattern = [
      { type: 'doum', time: 0 },    // Low
      { type: 'tek', time: 0.5 },   // High
      { type: 'tek', time: 0.75 },  // High
      { type: 'doum', time: 1.5 },  // Low
      { type: 'tek', time: 2.5 },   // High
    ];

    for (let measure = 0; measure < duration / 3; measure++) {
      pattern.forEach(({ type, time }) => {
        const beatTime = measure * 3 + time;
        if (beatTime < duration) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          if (type === 'doum') {
            // Low drum hit
            osc.frequency.setValueAtTime(60, startTime + beatTime);
            filter.frequency.setValueAtTime(100, startTime + beatTime);
            gain.gain.setValueAtTime(0.12, startTime + beatTime);
          } else {
            // High drum hit
            osc.frequency.setValueAtTime(150, startTime + beatTime);
            filter.frequency.setValueAtTime(800, startTime + beatTime);
            gain.gain.setValueAtTime(0.08, startTime + beatTime);
          }

          osc.type = 'sine';
          filter.type = 'bandpass';
          filter.Q.setValueAtTime(2, startTime + beatTime);

          gain.gain.exponentialRampToValueAtTime(0.001, startTime + beatTime + 0.1);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc.start(startTime + beatTime);
          osc.stop(startTime + beatTime + 0.2);

          this.arabicWorkshopNodes.push(osc, gain, filter);
        }
      });
    }
  }

  private createArabicDrone(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Continuous drone note
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(164.81, startTime); // E3 drone
    osc.type = 'sine';

    gain.gain.setValueAtTime(0.1, startTime);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);

    this.arabicWorkshopNodes.push(osc, gain);
  }

  public stopArabicWorkshopMusic() {
    this.arabicWorkshopPlaying = false;
    this.arabicWorkshopNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
      } catch (e) {}
    });
    this.arabicWorkshopNodes = [];
  }

  /**
   * MEDIEVAL EUROPEAN WORKSHOP SONG - Lute and recorder inspired medieval melody
   */
  public playMedievalWorkshopMusic() {
    if (this.isMuted || this.medievalWorkshopPlaying) return;
    const ctx = this.ensureAudioContext();
    if (!ctx) return;

    try {
      this.medievalWorkshopPlaying = true;
      this.medievalWorkshopNodes = [];
      const now = ctx.currentTime;
      const loopDuration = 40; // Much longer for ambient feel

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(0.6 * this.masterVolume, now + 4); // Very slow fade-in
      masterGain.connect(ctx.destination);
      this.medievalWorkshopNodes.push(masterGain);

      // Simple medieval layers
      this.createMedievalMelody(ctx, now, loopDuration, masterGain);
      this.createMedievalHarmony(ctx, now, loopDuration, masterGain);
      this.createMedievalRhythm(ctx, now, loopDuration, masterGain);

      const loopMedieval = () => {
        if (this.medievalWorkshopPlaying) {
          setTimeout(() => {
            if (this.medievalWorkshopPlaying) {
              this.medievalWorkshopNodes = [masterGain];
              this.createMedievalMelody(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createMedievalHarmony(ctx, ctx.currentTime, loopDuration, masterGain);
              this.createMedievalRhythm(ctx, ctx.currentTime, loopDuration, masterGain);
              loopMedieval();
            }
          }, loopDuration * 1000);
        }
      };
      loopMedieval();

    } catch (error) {
      console.error('Error playing medieval workshop music:', error);
      this.medievalWorkshopPlaying = false;
    }
  }

  private createMedievalMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.25, startTime);
    melodyGain.connect(masterGain);

    // Simple Medieval melody (D minor: D-E-F-G-A-Bb-C)
    const melody = [
      {note: 293.66, duration: 2.5, delay: 0},     // D4
      {note: 349.23, duration: 2.0, delay: 3.0},   // F4
      {note: 392.00, duration: 2.5, delay: 5.5},   // G4
      {note: 440.00, duration: 1.5, delay: 8.5},   // A4
      {note: 349.23, duration: 2.0, delay: 10.5},  // F4
      {note: 293.66, duration: 3.0, delay: 13.0}   // D4 (resolve)
    ];

    melody.forEach(({note, duration, delay}) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, startTime + delay);

      // Gentle envelope like fishing music
      gain.gain.setValueAtTime(0, startTime + delay);
      gain.gain.linearRampToValueAtTime(0.6, startTime + delay + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.3, startTime + delay + duration - 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + delay + duration);

      osc.connect(gain);
      gain.connect(melodyGain);

      osc.start(startTime + delay);
      osc.stop(startTime + delay + duration);
      this.medievalWorkshopNodes.push(osc, gain);
    });

    this.medievalWorkshopNodes.push(melodyGain);
  }

  private createMedievalHarmony(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const harmonyGain = ctx.createGain();
    harmonyGain.gain.setValueAtTime(0.15, startTime);
    harmonyGain.connect(masterGain);

    // Simple bass line like generic music
    const bass = [
      {note: 146.83, duration: 4.0, delay: 0},     // D3
      {note: 174.61, duration: 4.0, delay: 4.0},   // F3
      {note: 196.00, duration: 4.0, delay: 8.0},   // G3
      {note: 146.83, duration: 4.0, delay: 12.0}   // D3
    ];

    bass.forEach(({note, duration, delay}) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note, startTime + delay);

      // Simple envelope
      gain.gain.setValueAtTime(0, startTime + delay);
      gain.gain.linearRampToValueAtTime(0.5, startTime + delay + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.2, startTime + delay + duration - 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + delay + duration);

      osc.connect(gain);
      gain.connect(harmonyGain);

      osc.start(startTime + delay);
      osc.stop(startTime + delay + duration);
      this.medievalWorkshopNodes.push(osc, gain);
    });

    this.medievalWorkshopNodes.push(harmonyGain);
  }

  private createMedievalRhythm(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const rhythmGain = ctx.createGain();
    rhythmGain.gain.setValueAtTime(0.08, startTime);
    rhythmGain.connect(masterGain);

    // Simple, slow drum pattern like fishing music
    const beats = [
      {delay: 0, duration: 0.15, freq: 60},
      {delay: 4.0, duration: 0.12, freq: 80},
      {delay: 8.0, duration: 0.15, freq: 60},
      {delay: 12.0, duration: 0.12, freq: 80}
    ];

    beats.forEach(({delay, duration, freq}) => {
      if (startTime + delay < startTime + duration) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime + delay);

        // Simple drum envelope
        gain.gain.setValueAtTime(0.6, startTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + delay + duration);

        osc.connect(gain);
        gain.connect(rhythmGain);

        osc.start(startTime + delay);
        osc.stop(startTime + delay + duration);
        this.medievalWorkshopNodes.push(osc, gain);
      }
    });

    this.medievalWorkshopNodes.push(rhythmGain);
  }


  public stopMedievalWorkshopMusic() {
    this.medievalWorkshopPlaying = false;
    this.medievalWorkshopNodes.forEach(node => {
      try {
        if ('stop' in node && typeof node.stop === 'function') {
          node.stop();
        }
      } catch (e) {}
    });
    this.medievalWorkshopNodes = [];
  }

  /**
   * Stop all sounds
   */
  public stopAllSounds() {
    this.stopSmithyAmbient();
    this.stopPotteryAmbient();
    this.stopWeavingAmbient();
    this.stopBakeryAmbient();
    this.stopCarpentryAmbient();
    this.stopJapaneseWorkshopMusic();
    this.stopArabicWorkshopMusic();
    this.stopMedievalWorkshopMusic();
  }

  // SIMPLE JAPANESE METHODS - based on fishing music success
  private createJapaneseMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.3, startTime);
    melodyGain.connect(masterGain);

    // Simple Japanese pentatonic melody (A minor pentatonic: A-C-D-E-G)
    const melody = [
      {note: 440, duration: 3.0, delay: 0},     // A4
      {note: 523.25, duration: 2.5, delay: 3.5}, // C5
      {note: 587.33, duration: 3.0, delay: 6.5}, // D5
      {note: 659.25, duration: 2.0, delay: 10},  // E5
      {note: 783.99, duration: 4.0, delay: 12.5}, // G5
      {note: 659.25, duration: 2.5, delay: 17},  // E5
      {note: 587.33, duration: 3.0, delay: 20},  // D5
      {note: 523.25, duration: 2.5, delay: 23.5}, // C5
      {note: 440, duration: 5.0, delay: 26.5},   // A4 - long ending
    ];

    melody.forEach(({ note, duration, delay }) => {
      if (delay < duration) {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const noteTime = startTime + delay;

        osc.connect(noteGain);
        noteGain.connect(melodyGain);

        osc.type = 'sine'; // Pure, gentle like fishing music
        osc.frequency.value = note;

        // Gentle attack and release like fishing music
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.4, noteTime + 0.3);
        noteGain.gain.exponentialRampToValueAtTime(0.15, noteTime + duration * 0.7);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + duration);

        osc.start(noteTime);
        osc.stop(noteTime + duration);
        this.japaneseWorkshopNodes.push(osc, noteGain);
      }
    });

    this.japaneseWorkshopNodes.push(melodyGain);
  }

  private createJapaneseChords(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const chordGain = ctx.createGain();
    chordGain.gain.setValueAtTime(0.15, startTime);
    chordGain.connect(masterGain);

    // Simple chord progression like fishing music (Am-F-C-G)
    const chordProgression = [
      {chords: [220, 261.63, 329.63], duration: 12, delay: 0},  // A minor
      {chords: [174.61, 220, 293.66], duration: 12, delay: 12}, // F major
      {chords: [261.63, 329.63, 392], duration: 12, delay: 24}, // C major
      {chords: [196, 246.94, 329.63], duration: 12, delay: 36}, // G major
    ];

    chordProgression.forEach(({ chords, duration: chordDuration, delay }) => {
      if (delay < duration) {
        chords.forEach(freq => {
          const chord = ctx.createOscillator();
          const chordNoteGain = ctx.createGain();
          const chordTime = startTime + delay;

          chord.connect(chordNoteGain);
          chordNoteGain.connect(chordGain);

          chord.type = 'triangle'; // Soft, warm tone like fishing music
          chord.frequency.value = freq;

          // Gradual fade in and out like fishing music
          chordNoteGain.gain.setValueAtTime(0, chordTime);
          chordNoteGain.gain.linearRampToValueAtTime(0.4, chordTime + 2);
          chordNoteGain.gain.setValueAtTime(0.4, chordTime + chordDuration - 2);
          chordNoteGain.gain.linearRampToValueAtTime(0.01, chordTime + chordDuration);

          chord.start(chordTime);
          chord.stop(chordTime + chordDuration);
          this.japaneseWorkshopNodes.push(chord, chordNoteGain);
        });
      }
    });

    this.japaneseWorkshopNodes.push(chordGain);
  }

  private createJapaneseArpeggio(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const arpeggioGain = ctx.createGain();
    arpeggioGain.gain.setValueAtTime(0.1, startTime);
    arpeggioGain.connect(masterGain);

    // Gentle arpeggio like fishing music
    const arpeggioNotes = [
      440, 523.25, 659.25, 783.99, // A4, C5, E5, G5
      659.25, 523.25, 440, 329.63  // E5, C5, A4, E4
    ];

    const noteLength = 1.5; // Slower than fishing music for calm feel

    for (let i = 0; i < duration; i += noteLength) {
      const noteIndex = Math.floor(i / noteLength) % arpeggioNotes.length;
      const arp = ctx.createOscillator();
      const arpNoteGain = ctx.createGain();

      arp.connect(arpNoteGain);
      arpNoteGain.connect(arpeggioGain);

      arp.type = 'triangle';
      arp.frequency.value = arpeggioNotes[noteIndex];

      // Gentle envelope like fishing music
      arpNoteGain.gain.setValueAtTime(0, startTime + i);
      arpNoteGain.gain.linearRampToValueAtTime(0.6, startTime + i + 0.2);
      arpNoteGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + noteLength);

      arp.start(startTime + i);
      arp.stop(startTime + i + noteLength);
      this.japaneseWorkshopNodes.push(arp, arpNoteGain);
    }

    this.japaneseWorkshopNodes.push(arpeggioGain);
  }

  // Remove complex harmonics method - keep it simple

  // MIDDLE EASTERN MELODY - authentic and delightful
  private createArabicMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const melodyGain = ctx.createGain();
    melodyGain.gain.setValueAtTime(0.35, startTime);
    melodyGain.connect(masterGain);

    // Authentic Hijaz maqam melody (D-Eb-F#-G-A-Bb-C-D) - creates distinctive Middle Eastern sound
    const melody = [
      {note: 293.66, duration: 1.8, delay: 0},     // D4 - opening
      {note: 311.13, duration: 1.0, delay: 2.0},   // Eb4 (creates Middle Eastern flavor)
      {note: 369.99, duration: 2.2, delay: 3.2},   // F#4 (characteristic Hijaz augmented second)
      {note: 392.00, duration: 1.5, delay: 5.8},   // G4
      {note: 440.00, duration: 2.5, delay: 7.5},   // A4 - peak
      {note: 369.99, duration: 1.8, delay: 10.5},  // F#4 - descent
      {note: 293.66, duration: 3.0, delay: 12.5},  // D4 - resolve

      // Second phrase - variation
      {note: 440.00, duration: 1.5, delay: 16.0},  // A4 - start higher
      {note: 466.16, duration: 1.2, delay: 17.8},  // Bb4
      {note: 523.25, duration: 2.0, delay: 19.2},  // C5 - highest note
      {note: 440.00, duration: 1.8, delay: 21.5},  // A4
      {note: 369.99, duration: 2.0, delay: 23.5},  // F#4
      {note: 311.13, duration: 1.5, delay: 25.8},  // Eb4
      {note: 293.66, duration: 4.0, delay: 27.5}   // D4 - final resolution
    ];

    melody.forEach(({ note, duration, delay }) => {
      if (delay < duration) {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const noteTime = startTime + delay;

        // Create oud-like timbre with harmonics
        const osc2 = ctx.createOscillator();
        const osc2Gain = ctx.createGain();

        osc.connect(noteGain);
        osc2.connect(osc2Gain);
        noteGain.connect(melodyGain);
        osc2Gain.connect(melodyGain);

        // Main tone - sawtooth for brightness like oud
        osc.type = 'sawtooth';
        osc.frequency.value = note;

        // Harmonic - adds richness and authenticity
        osc2.type = 'triangle';
        osc2.frequency.value = note * 1.5; // Perfect fifth
        osc2Gain.gain.setValueAtTime(0.25, noteTime);

        // Middle Eastern ornamental envelope
        noteGain.gain.setValueAtTime(0, noteTime);
        noteGain.gain.linearRampToValueAtTime(0.7, noteTime + 0.1);
        noteGain.gain.setValueAtTime(0.5, noteTime + 0.4);
        noteGain.gain.exponentialRampToValueAtTime(0.25, noteTime + duration * 0.7);
        noteGain.gain.exponentialRampToValueAtTime(0.01, noteTime + duration);

        // Add characteristic microtonal inflection
        const bendAmount = note * 0.018;
        osc.frequency.setValueAtTime(note - bendAmount, noteTime);
        osc.frequency.linearRampToValueAtTime(note + bendAmount * 0.5, noteTime + 0.15);
        osc.frequency.linearRampToValueAtTime(note, noteTime + 0.3);

        osc.start(noteTime);
        osc.stop(noteTime + duration);
        osc2.start(noteTime);
        osc2.stop(noteTime + duration);
        this.arabicWorkshopNodes.push(osc, noteGain, osc2, osc2Gain);
      }
    });

    this.arabicWorkshopNodes.push(melodyGain);
  }

  private createArabicBass(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const bassGain = ctx.createGain();
    bassGain.gain.setValueAtTime(0.3, startTime);
    bassGain.connect(masterGain);

    // Simple bass line like generic music (E-A-B-E)
    const bassNotes = [82.41, 110, 123.47, 82.41]; // E2, A2, B2, E2
    const noteLength = 2.0; // Moderate tempo

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
      this.arabicWorkshopNodes.push(bass, noteGain);
    }

    this.arabicWorkshopNodes.push(bassGain);
  }

  private createArabicDrums(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const drumGain = ctx.createGain();
    drumGain.gain.setValueAtTime(0.4, startTime);
    drumGain.connect(masterGain);

    const beatInterval = 0.5; // Fun, moderate tempo like generic music

    for (let i = 0; i < duration; i += beatInterval) {
      const beat = Math.floor(i / beatInterval) % 4;

      if (beat === 0 || beat === 2) {
        // Low "doum" drum on 1 and 3
        this.createArabicDoum(ctx, startTime + i, drumGain);
      }

      if (beat === 1 || beat === 3) {
        // High "tek" drum on 2 and 4
        this.createArabicTek(ctx, startTime + i, drumGain);
      }
    }

    this.arabicWorkshopNodes.push(drumGain);
  }

  private createArabicDoum(ctx: AudioContext, time: number, drumGain: GainNode) {
    const doum = ctx.createOscillator();
    const doumGain = ctx.createGain();

    doum.connect(doumGain);
    doumGain.connect(drumGain);

    doum.type = 'sine';
    doum.frequency.setValueAtTime(60, time);
    doum.frequency.exponentialRampToValueAtTime(40, time + 0.1);

    doumGain.gain.setValueAtTime(1.0, time);
    doumGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    doum.start(time);
    doum.stop(time + 0.15);
    this.arabicWorkshopNodes.push(doum, doumGain);
  }

  private createArabicTek(ctx: AudioContext, time: number, drumGain: GainNode) {
    const tek = ctx.createBufferSource();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (buffer.length * 0.3));
    }

    tek.buffer = buffer;

    const tekGain = ctx.createGain();
    const tekFilter = ctx.createBiquadFilter();

    tek.connect(tekFilter);
    tekFilter.connect(tekGain);
    tekGain.connect(drumGain);

    tekFilter.type = 'highpass';
    tekFilter.frequency.value = 800;

    tekGain.gain.setValueAtTime(0.6, time);
    tekGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    tek.start(time);
    this.arabicWorkshopNodes.push(tek, tekGain, tekFilter);
  }

  private createArabicPercussion(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    const percGain = ctx.createGain();
    percGain.gain.setValueAtTime(0.15, startTime);
    percGain.connect(masterGain);

    // Simple castanets/shaker rhythm - fun but not too complex
    const shakeInterval = 0.25; // 16th notes

    for (let i = 0; i < duration; i += shakeInterval) {
      const beat16 = Math.floor(i / shakeInterval) % 16;

      // Only on certain beats for a fun pattern
      if ([0, 3, 6, 8, 11, 14].includes(beat16)) {
        const shake = ctx.createBufferSource();
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let j = 0; j < buffer.length; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (buffer.length * 0.1));
        }

        shake.buffer = buffer;

        const shakeGain = ctx.createGain();
        const shakeFilter = ctx.createBiquadFilter();

        shake.connect(shakeFilter);
        shakeFilter.connect(shakeGain);
        shakeGain.connect(percGain);

        shakeFilter.type = 'highpass';
        shakeFilter.frequency.value = 4000;

        const accent = [0, 8].includes(beat16);
        shakeGain.gain.setValueAtTime(accent ? 0.3 : 0.2, startTime + i);
        shakeGain.gain.exponentialRampToValueAtTime(0.01, startTime + i + 0.05);

        shake.start(startTime + i);
        this.arabicWorkshopNodes.push(shake, shakeGain, shakeFilter);
      }
    }

    this.arabicWorkshopNodes.push(percGain);
  }

  // Remove complex drone - keep it simple

  // NEW SOPHISTICATED MEDIEVAL METHODS
  private createAmbientMedievalMelody(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Slow, modal melody in Dorian mode with very long notes
    const melody = [
      { note: 293.66, time: 2, dur: 8.0 },   // D4 - very long
      { note: 329.63, time: 11, dur: 6.0 },  // E4
      { note: 349.23, time: 18, dur: 5.0 },  // F4
      { note: 392, time: 24, dur: 7.0 },     // G4
      { note: 440, time: 32, dur: 8.0 },     // A4 - longest note
    ];

    melody.forEach(({ note, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.frequency.setValueAtTime(note, startTime + time);
      osc.type = 'triangle';

      // Very slow, gentle vibrato
      const vibrato = ctx.createOscillator();
      vibrato.frequency.setValueAtTime(1.0, startTime + time);
      vibrato.type = 'sine';
      const vibratoGain = ctx.createGain();
      vibratoGain.gain.setValueAtTime(note * 0.015, startTime + time);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1000, startTime + time);

      // Extremely slow attack and decay
      gain.gain.setValueAtTime(0, startTime + time);
      gain.gain.linearRampToValueAtTime(0.12, startTime + time + 2.0);
      gain.gain.setValueAtTime(0.12, startTime + time + dur - 2.0);
      gain.gain.linearRampToValueAtTime(0, startTime + time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime + time);
      osc.stop(startTime + time + dur + 0.1);
      vibrato.start(startTime + time);
      vibrato.stop(startTime + time + dur + 0.1);

      this.medievalWorkshopNodes.push(osc, gain, filter, vibrato, vibratoGain);
    });
  }

  private createMedievalStringDrones(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Deep, rich string drones
    const drones = [
      { freq: 146.83, volume: 0.06 }, // D3
      { freq: 220, volume: 0.05 },    // A3
      { freq: 293.66, volume: 0.04 }, // D4
    ];

    drones.forEach(({ freq, volume }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.frequency.setValueAtTime(freq, startTime);
      osc.type = 'sawtooth';

      // Subtle chorusing effect
      const chorus = ctx.createOscillator();
      chorus.frequency.setValueAtTime(0.2, startTime);
      chorus.type = 'sine';
      const chorusGain = ctx.createGain();
      chorusGain.gain.setValueAtTime(freq * 0.005, startTime);
      chorus.connect(chorusGain);
      chorusGain.connect(osc.frequency);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 4);
      gain.gain.setValueAtTime(volume, startTime + duration - 4);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);

      osc.start(startTime);
      osc.stop(startTime + duration);
      chorus.start(startTime);
      chorus.stop(startTime + duration);

      this.medievalWorkshopNodes.push(osc, gain, filter, chorus, chorusGain);
    });
  }

  private createMedievalModalHarmony(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Modal harmony using medieval intervals
    const harmonies = [
      { notes: [146.83, 220, 293.66], time: 0, dur: 20 },     // Dm chord
      { notes: [174.61, 261.63, 349.23], time: 16, dur: 24 }, // F major chord
    ];

    harmonies.forEach(({ notes, time, dur }) => {
      notes.forEach((note, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.frequency.setValueAtTime(note, startTime + time);
        osc.type = 'sine';

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 - index * 100, startTime + time);

        // Very gradual entrance
        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.04, startTime + time + 3);
        gain.gain.setValueAtTime(0.04, startTime + time + dur - 3);
        gain.gain.linearRampToValueAtTime(0, startTime + time + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime + time);
        osc.stop(startTime + time + dur);

        this.medievalWorkshopNodes.push(osc, gain, filter);
      });
    });
  }

  private createAtmosphericWinds(ctx: AudioContext, startTime: number, duration: number, masterGain: GainNode) {
    // Gentle, atmospheric wind sounds
    for (let i = 0; i < 2; i++) {
      const time = i * 20 + 10;
      if (time < duration) {
        const bufferSize = ctx.sampleRate * 12;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate wind-like noise
        for (let j = 0; j < bufferSize; j++) {
          const envelope = Math.sin((j / bufferSize) * Math.PI * 0.5) * Math.sin((j / bufferSize) * Math.PI);
          data[j] = (Math.random() * 2 - 1) * envelope * 0.2;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300 + i * 100, startTime + time);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, startTime + time);
        gain.gain.linearRampToValueAtTime(0.03, startTime + time + 3);
        gain.gain.setValueAtTime(0.03, startTime + time + 9);
        gain.gain.linearRampToValueAtTime(0, startTime + time + 12);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        source.start(startTime + time);
        source.stop(startTime + time + 12);

        this.medievalWorkshopNodes.push(source, filter, gain);
      }
    }
  }
}

// Export singleton instance
const citySoundsService = CitySoundsService.getInstance();
export default citySoundsService;