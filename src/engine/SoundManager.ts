// ============================================================
//  坦克大战 — 音效管理器（Web Audio API 程序化生成）
// ============================================================

export class SoundManager {
  private ctx: AudioContext | null = null;
  private muted = false;
  private volume = 0.3;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  setMuted(m: boolean): void {
    this.muted = m;
  }

  // ====== 工具函数 ======

  private gain(ctx: AudioContext, vol = 1): GainNode {
    const g = ctx.createGain();
    g.gain.value = this.muted ? 0 : vol * this.volume;
    return g;
  }

  // ====== 音效方法 ======

  /** 射击 — 短促高频方波 */
  playShoot(): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = this.gain(ctx, 0.3);
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.06);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.stop(ctx.currentTime + 0.08);
  }

  /** 爆炸 — 白噪声衰减 + 低频轰隆 */
  playExplosion(): void {
    const ctx = this.getCtx();
    const len = 0.15;

    // 白噪声
    const bufferSize = Math.floor(ctx.sampleRate * len);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseG = this.gain(ctx, 0.4);
    noise.connect(noiseG);
    noiseG.connect(ctx.destination);

    // 低频
    const osc = ctx.createOscillator();
    const oscG = this.gain(ctx, 0.5);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + len);
    osc.connect(oscG);
    oscG.connect(ctx.destination);

    noise.start();
    osc.start();
    noiseG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len);
    oscG.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len);
    noise.stop(ctx.currentTime + len);
    osc.stop(ctx.currentTime + len);
  }

  /** 敌人死亡 — 降调方波 */
  playEnemyDeath(): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = this.gain(ctx, 0.35);
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.1);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.stop(ctx.currentTime + 0.12);
  }

  /** 玩家受伤 — 刺耳噪声 */
  playPlayerHit(): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = this.gain(ctx, 0.3);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
    osc.connect(g);
    g.connect(ctx.destination);

    // 低频嗡
    const osc2 = ctx.createOscillator();
    const g2 = this.gain(ctx, 0.2);
    osc2.type = 'sine';
    osc2.frequency.value = 60;
    osc2.connect(g2);
    g2.connect(ctx.destination);

    osc.start();
    osc2.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);
    osc2.stop(ctx.currentTime + 0.1);
  }

  /** 升级 — 上行三音符 */
  playLevelUp(): void {
    const ctx = this.getCtx();
    const notes = [523, 659, 784]; // C5 E5 G5
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = this.gain(ctx, 0.25);
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(g);
      g.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.08;
      osc.start(start);
      g.gain.setValueAtTime(0.25 * this.volume, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
      osc.stop(start + 0.12);
    });
  }

  /** 大型坦克预警脉冲 — 低频重复 3 次 */
  playLargeTankWarning(): void {
    const ctx = this.getCtx();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const g = this.gain(ctx, 0.25);
      osc.type = 'sine';
      osc.frequency.value = 100;
      osc.connect(g);
      g.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.25;
      osc.start(start);
      g.gain.setValueAtTime(0.25 * this.volume, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
      osc.stop(start + 0.15);
    }
  }

  /** 大型坦克生成 — 沉重低频 */
  playLargeTankSpawn(): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = this.gain(ctx, 0.5);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.2);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.stop(ctx.currentTime + 0.25);
  }

  /** 特殊技能激活 — 叮咚上升 */
  playSpecialSkillActivate(): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = this.gain(ctx, 0.3);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    g.gain.setValueAtTime(0.3 * this.volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.stop(ctx.currentTime + 0.18);
  }

  /** 地雷放置 — 短促滴答 */
  playMinePlace(): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const g = this.gain(ctx, 0.2);
    osc.type = 'sine';
    osc.frequency.value = 1200;
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.stop(ctx.currentTime + 0.04);
  }

  /** 瞬移 — 嗖声 */
  playTeleport(): void {
    const ctx = this.getCtx();
    const len = 0.1;
    const bufferSize = Math.floor(ctx.sampleRate * len);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    // 带通滤波
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2000, ctx.currentTime);
    bp.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + len);
    bp.Q.value = 5;

    const g = this.gain(ctx, 0.35);
    noise.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    noise.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len + 0.02);
    noise.stop(ctx.currentTime + len + 0.02);
  }

  /** 冰封减速 — 寒冷风声 */
  playIceSlow(): void {
    const ctx = this.getCtx();
    const len = 0.25;
    const bufferSize = Math.floor(ctx.sampleRate * len);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize) * 0.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;

    const g = this.gain(ctx, 0.25);
    noise.connect(hp);
    hp.connect(g);
    g.connect(ctx.destination);
    noise.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + len);
    noise.stop(ctx.currentTime + len);
  }

  /** 分身生成 — 回声音效 */
  playCloneSpawn(): void {
    const ctx = this.getCtx();
    for (let i = 0; i < 2; i++) {
      const osc = ctx.createOscillator();
      const g = this.gain(ctx, 0.2);
      osc.type = 'sine';
      osc.frequency.value = 400 + i * 200;
      osc.connect(g);
      g.connect(ctx.destination);
      const start = ctx.currentTime + i * 0.06;
      osc.start(start);
      g.gain.setValueAtTime(0.2 * this.volume, start);
      g.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
      osc.stop(start + 0.1);
    }
  }

  /** 清理 */
  destroy(): void {
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
