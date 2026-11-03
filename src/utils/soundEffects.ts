// Web Audio API Synthesizer for POS Cash Register & Tactile Liquid UI

class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Subtle tactile liquid tap / scanner beep when adding a product to a cart
   */
  public playAddProduct() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.065);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.085);
  }

  /**
   * Subtle cart switch sound when selecting Cart 1..5
   */
  public playCartSwitch() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(587.33, now + 0.055);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Authentic Cash Register "Cha-Ching!" bell & drawer sound when charging a cart
   */
  public playCashRegister() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Mechanical drawer spring release ("Cha-")
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.09, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseBuffer.length; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.setValueAtTime(2.2, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.085);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    whiteNoise.start(now);

    // Low mechanical thump of cash drawer opening
    const drawerOsc = ctx.createOscillator();
    const drawerGain = ctx.createGain();
    drawerOsc.type = 'triangle';
    drawerOsc.frequency.setValueAtTime(150, now + 0.02);
    drawerOsc.frequency.exponentialRampToValueAtTime(65, now + 0.12);
    drawerGain.gain.setValueAtTime(0.22, now + 0.02);
    drawerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    drawerOsc.connect(drawerGain);
    drawerGain.connect(ctx.destination);
    drawerOsc.start(now + 0.02);
    drawerOsc.stop(now + 0.14);

    // 2. High-pitched brass bell chime ("-Ching!")
    const bellNotes = [
      { freq: 2093.0, delay: 0.09, duration: 0.55, vol: 0.22 }, // C7
      { freq: 2637.02, delay: 0.15, duration: 0.75, vol: 0.26 }, // E7
      { freq: 3135.96, delay: 0.15, duration: 0.85, vol: 0.18 }, // G7 harmonic
      { freq: 4186.01, delay: 0.155, duration: 0.65, vol: 0.12 }, // C8 shimmer
    ];

    bellNotes.forEach(({ freq, delay, duration, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      gain.gain.setValueAtTime(0.001, now + delay);
      gain.gain.linearRampToValueAtTime(vol, now + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.02);
    });
  }

  /**
   * Subtle cancel sound when clearing a cart
   */
  public playCancelCart() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(210, now + 0.14);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }
}

export const soundFX = new SoundEffectsManager();
