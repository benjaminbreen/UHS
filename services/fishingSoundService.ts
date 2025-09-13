/**
 * fishingSoundService.ts - Manages realistic fishing sound effects
 * Uses Web Audio API for subtle, pleasant sounds
 */

class FishingSoundService {
  private audioContext: AudioContext | null = null;
  private masterVolume: number = 0.3; // Keep sounds subtle
  private sounds: Map<string, AudioBuffer> = new Map();
  private enabled: boolean = true;

  constructor() {
    // Initialize on first user interaction
    if (typeof window !== 'undefined') {
      this.initializeOnInteraction();
    }
  }

  private initializeOnInteraction() {
    const init = () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.createSounds();
      }
      // Remove listener after initialization
      document.removeEventListener('click', init);
      document.removeEventListener('touchstart', init);
    };

    document.addEventListener('click', init, { once: true });
    document.addEventListener('touchstart', init, { once: true });
  }

  private createSounds() {
    if (!this.audioContext) return;

    // Create synthetic sounds using Web Audio API for better control
    this.createCastSound();
    this.createSplashSound();
    this.createHookSound();
    this.createReelSound();
    this.createCatchSound();
  }

  // Casting line - gentle whoosh followed by plop
  private createCastSound() {
    if (!this.audioContext) return;
    
    const duration = 1.2;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      
      // Whoosh sound (0-0.3s)
      if (t < 0.3) {
        const whooshEnv = Math.sin((t / 0.3) * Math.PI);
        const freq = 800 - (t * 2000); // Descending frequency
        data[i] = whooshEnv * Math.sin(2 * Math.PI * freq * t) * 0.2;
        // Add some noise for texture
        data[i] += (Math.random() - 0.5) * whooshEnv * 0.05;
      }
      
      // Small plop sound (0.5-0.7s)
      if (t > 0.5 && t < 0.7) {
        const plopEnv = Math.exp(-(t - 0.5) * 15);
        const freq = 200 + Math.sin((t - 0.5) * 20) * 50;
        data[i] = plopEnv * Math.sin(2 * Math.PI * freq * t) * 0.3;
      }
    }

    this.sounds.set('cast', buffer);
  }

  // Water splash - realistic water droplets
  private createSplashSound() {
    if (!this.audioContext) return;
    
    const duration = 0.8;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, duration * sampleRate, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        
        // Multiple water droplets at different times
        let sample = 0;
        
        // Main splash
        if (t < 0.2) {
          const env = Math.exp(-t * 10);
          const freq = 600 + Math.random() * 200;
          sample += env * Math.sin(2 * Math.PI * freq * t) * 0.4;
          sample += (Math.random() - 0.5) * env * 0.3; // Water noise
        }
        
        // Secondary droplets
        for (let d = 0; d < 3; d++) {
          const dropTime = 0.1 + d * 0.15;
          if (t > dropTime && t < dropTime + 0.1) {
            const dropEnv = Math.exp(-(t - dropTime) * 20);
            const dropFreq = 400 + Math.random() * 400;
            sample += dropEnv * Math.sin(2 * Math.PI * dropFreq * t) * 0.2;
          }
        }
        
        data[i] = sample * (channel === 0 ? 0.9 : 1.1); // Slight stereo effect
      }
    }

    this.sounds.set('splash', buffer);
  }

  // Hook set - quick tension sound
  private createHookSound() {
    if (!this.audioContext) return;
    
    const duration = 0.3;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      
      // Quick "zing" sound
      const env = Math.exp(-t * 8);
      const freq = 1200 + Math.sin(t * 30) * 200;
      data[i] = env * Math.sin(2 * Math.PI * freq * t) * 0.25;
      
      // Add tension click at start
      if (t < 0.01) {
        data[i] += (Math.random() - 0.5) * 0.3;
      }
    }

    this.sounds.set('hook', buffer);
  }

  // Reeling - rhythmic clicking
  private createReelSound() {
    if (!this.audioContext) return;
    
    const duration = 0.2;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
      const t = i / sampleRate;
      
      // Mechanical clicking sound
      const clickPattern = Math.sin(t * 60) > 0.8 ? 1 : 0;
      const env = Math.exp(-t * 5);
      const freq = 800 + Math.sin(t * 100) * 100;
      
      data[i] = clickPattern * env * Math.sin(2 * Math.PI * freq * t) * 0.15;
      data[i] += (Math.random() - 0.5) * clickPattern * env * 0.05;
    }

    this.sounds.set('reel', buffer);
  }

  // Fish caught - success chime with water
  private createCatchSound() {
    if (!this.audioContext) return;
    
    const duration = 1.5;
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(2, duration * sampleRate, sampleRate);
    
    // Musical notes for success: C-E-G (major chord)
    const notes = [261.63, 329.63, 392.00]; // C4, E4, G4
    
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      
      for (let i = 0; i < buffer.length; i++) {
        const t = i / sampleRate;
        let sample = 0;
        
        // Play notes in sequence
        notes.forEach((freq, index) => {
          const noteStart = index * 0.15;
          if (t > noteStart && t < noteStart + 0.5) {
            const noteEnv = Math.exp(-(t - noteStart) * 2);
            sample += noteEnv * Math.sin(2 * Math.PI * freq * t) * 0.2;
            // Add harmonics for richness
            sample += noteEnv * Math.sin(2 * Math.PI * freq * 2 * t) * 0.05;
          }
        });
        
        // Add water splash at end
        if (t > 0.6 && t < 0.9) {
          const splashEnv = Math.exp(-(t - 0.6) * 8);
          const splashFreq = 400 + Math.random() * 200;
          sample += splashEnv * Math.sin(2 * Math.PI * splashFreq * t) * 0.3;
          sample += (Math.random() - 0.5) * splashEnv * 0.2;
        }
        
        data[i] = sample * (channel === 0 ? 0.95 : 1.05); // Slight stereo width
      }
    }

    this.sounds.set('catch', buffer);
  }

  // Play a sound effect
  public playSound(soundName: 'cast' | 'splash' | 'hook' | 'reel' | 'catch', volume: number = 1.0) {
    if (!this.enabled || !this.audioContext || this.audioContext.state === 'suspended') {
      // Try to resume context if suspended
      this.audioContext?.resume();
      return;
    }

    const buffer = this.sounds.get(soundName);
    if (!buffer) return;

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      // Apply volume with fade in to prevent clicks
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        this.masterVolume * volume,
        this.audioContext.currentTime + 0.01
      );
      
      source.start(0);
      
      // Clean up after playing
      source.onended = () => {
        source.disconnect();
        gainNode.disconnect();
      };
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  // Play cast sound with variable power
  public playCast(power: number = 0.5) {
    // Adjust pitch based on cast power
    this.playSound('cast', 0.7 + power * 0.3);
  }

  // Play splash with variable intensity
  public playSplash(intensity: number = 1.0) {
    this.playSound('splash', Math.min(1.0, intensity * 0.8));
  }

  // Toggle sound on/off
  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  // Set master volume (0-1)
  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }
}

// Export singleton instance
export const fishingSoundService = new FishingSoundService();