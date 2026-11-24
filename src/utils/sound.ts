// Synthesized game SFX, cheerful garden BGM loop, and zombie voice shout callouts

class SoundEngine {
  private ctx: AudioContext | null = null;
  private bgmTimer: number | null = null;
  private bgmStep = 0;
  private lastShoutAt = 0;

  public enabled = true;
  public bgmEnabled = true;

  private getCtx(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock() {
    this.getCtx();
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delay = 0
  ) {
    const ctx = this.getCtx();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0008, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Cheerful PvZ-inspired garden marimba/kalimba background loop
  public startBgm() {
    if (!this.enabled || !this.bgmEnabled || typeof window === 'undefined') return;
    if (this.bgmTimer !== null) return;

    // Playful C-major / A-minor bouncy garden motif (frequencies in Hz)
    const melody = [
      392.0, 523.25, 493.88, 440.0, 392.0, 329.63, 349.23, 392.0,
      440.0, 523.25, 587.33, 523.25, 493.88, 440.0, 392.0, 329.63,
    ];
    const bass = [
      130.81, 0, 196.0, 0, 146.83, 0, 196.0, 0,
      110.0, 0, 164.81, 0, 174.61, 0, 196.0, 0,
    ];

    this.bgmTimer = window.setInterval(() => {
      if (!this.enabled || !this.bgmEnabled) return;
      const ctx = this.getCtx();
      if (!ctx || ctx.state !== 'running') return;

      const idx = this.bgmStep % melody.length;
      const leadFreq = melody[idx];
      const bassFreq = bass[idx];

      if (leadFreq > 0) {
        this.tone(leadFreq, 0.24, 'triangle', 0.032, 0);
      }
      if (bassFreq > 0) {
        this.tone(bassFreq, 0.34, 'sine', 0.035, 0);
      }
      this.bgmStep += 1;
    }, 360);
  }

  public stopBgm() {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // Zombie shout sound effect + spoken voice cue
  public playZombieShout(spokenText?: string) {
    if (!this.enabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastShoutAt < 4200) return;
    this.lastShoutAt = nowMs;

    // Playful zombie groan/horn glide
    const ctx = this.getCtx();
    if (ctx) {
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(195, t);
      osc.frequency.linearRampToValueAtTime(260, t + 0.14);
      osc.frequency.linearRampToValueAtTime(155, t + 0.36);
      gain.gain.setValueAtTime(0.055, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    }

    // Spoken voice shout via Web Speech API
    if (
      spokenText &&
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof SpeechSynthesisUtterance !== 'undefined'
    ) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(spokenText);
        utter.lang = 'zh-CN';
        utter.rate = 1.15;
        utter.pitch = 1.05;
        utter.volume = 0.75;
        window.speechSynthesis.speak(utter);
      } catch {
        // Ignore speech synthesis errors on restricted browsers
      }
    }
  }

  playSun() {
    this.tone(660, 0.12, 'sine', 0.08, 0);
    this.tone(880, 0.16, 'sine', 0.08, 0.07);
  }

  playPlant() {
    this.tone(320, 0.09, 'triangle', 0.09, 0);
    this.tone(480, 0.12, 'triangle', 0.07, 0.05);
  }

  playShoot() {
    this.tone(520, 0.06, 'sine', 0.028, 0);
  }

  playHit() {
    this.tone(180, 0.06, 'triangle', 0.036, 0);
  }

  playExplosion() {
    this.tone(110, 0.28, 'sawtooth', 0.09, 0);
    this.tone(75, 0.35, 'triangle', 0.11, 0.05);
  }

  playCorrect(combo = 1) {
    if (combo >= 5 && combo % 5 === 0) {
      this.playCombo5();
      return;
    }
    if (combo === 3) {
      this.playCombo3();
      return;
    }
    // Slight pitch lift on ongoing combos for rhythmic momentum
    const shift = combo >= 2 ? Math.min(1.18, 1 + (combo - 1) * 0.03) : 1;
    this.tone(523.25 * shift, 0.12, 'triangle', 0.09, 0);
    this.tone(659.25 * shift, 0.12, 'triangle', 0.09, 0.08);
    this.tone(783.99 * shift, 0.22, 'triangle', 0.1, 0.16);
  }

  // Distinct energetic 4-note rising arpeggio for 3-Combo milestone
  playCombo3() {
    this.tone(523.25, 0.11, 'triangle', 0.1, 0);     // C5
    this.tone(659.25, 0.11, 'triangle', 0.1, 0.075); // E5
    this.tone(783.99, 0.12, 'triangle', 0.11, 0.15); // G5
    this.tone(1046.5, 0.28, 'sine', 0.12, 0.225);    // C6
    this.tone(523.25, 0.26, 'sine', 0.06, 0.225);    // warm root sustain
  }

  // Grand fanfare cascade + sparkle shimmer for 5-Combo (and multiples of 5)
  playCombo5() {
    this.tone(523.25, 0.1, 'triangle', 0.1, 0);      // C5
    this.tone(659.25, 0.1, 'triangle', 0.1, 0.065);  // E5
    this.tone(783.99, 0.1, 'triangle', 0.11, 0.13);  // G5
    this.tone(987.77, 0.12, 'triangle', 0.11, 0.195); // B5
    this.tone(1046.5, 0.34, 'triangle', 0.12, 0.26); // C6
    this.tone(1318.51, 0.34, 'sine', 0.09, 0.28);    // E6
    this.tone(1567.98, 0.36, 'sine', 0.08, 0.31);    // G6 sparkle
    this.tone(261.63, 0.38, 'sine', 0.07, 0.26);     // C4 bass anchor
  }

  playWrong() {
    this.tone(240, 0.16, 'sawtooth', 0.06, 0);
    this.tone(190, 0.22, 'sawtooth', 0.06, 0.12);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.tone(n, 0.22, 'triangle', 0.09, idx * 0.11);
    });
  }
}

export const soundEngine = new SoundEngine();
