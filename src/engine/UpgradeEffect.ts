// ============================================================
//  坦克大战 — 升级特效
// ============================================================

export class UpgradeEffect {
  x: number;
  y: number;
  level: number;
  timer: number;
  maxTimer: number;
  rings: Ring[];
  particles: Particle2[];
  floatingText: FloatingText | null;
  screenFlash: number;

  constructor(x: number, y: number, level: number) {
    this.x = x;
    this.y = y;
    this.level = level;
    this.maxTimer = 90; // 1.5 秒 (60fps)
    this.timer = this.maxTimer;
    this.rings = [];
    this.particles = [];
    this.floatingText = null;
    this.screenFlash = 0;

    // 初始化 3 轮环
    for (let i = 0; i < 3; i++) {
      this.rings.push(new Ring(x, y, i * 20));
    }

    // 粒子爆发
    const colors = ['#ffd700', '#ffffff', '#ffaa00', '#fff4b0'];
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push(
        new Particle2(
          x + (Math.random() - 0.5) * 10,
          y + (Math.random() - 0.5) * 10,
          colors[Math.floor(Math.random() * colors.length)],
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          20 + Math.floor(Math.random() * 15),
          2 + Math.random() * 2
        )
      );
    }

    // 飘字
    this.floatingText = new FloatingText(x, y, level);
  }

  update(): void {
    this.timer--;
    for (const r of this.rings) r.update();
    for (const p of this.particles) p.update();
    if (this.floatingText) this.floatingText.update();

    // 画面闪烁：在 15 帧和 45 帧时触发
    if (this.timer === this.maxTimer - 15 || this.timer === this.maxTimer - 45) {
      this.screenFlash = 6;
    }
    if (this.screenFlash > 0) this.screenFlash--;

    // 清理完成的粒子
    this.particles = this.particles.filter((p) => !p.dead);
  }

  get dead(): boolean {
    return this.timer <= 0;
  }

  /** 升级动画是否正在运行（用于暂停游戏逻辑） */
  get isActive(): boolean {
    return !this.dead;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    // 画面闪烁
    if (this.screenFlash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${this.screenFlash / 20})`;
      ctx.fillRect(0, 0, 640, 640);
    }

    // 光环
    for (const r of this.rings) r.draw(ctx);

    // 粒子
    for (const p of this.particles) p.draw(ctx);

    // 飘字
    if (this.floatingText) this.floatingText.draw(ctx);
  }
}

// ---- 光环 ----
class Ring {
  x: number;
  y: number;
  delay: number;
  maxRadius: number;
  progress: number;

  constructor(x: number, y: number, delay: number) {
    this.x = x;
    this.y = y;
    this.delay = delay;
    this.maxRadius = 80;
    this.progress = -delay; // 延迟后开始
  }

  update(): void {
    if (this.progress < this.maxRadius) this.progress += 2;
  }

  get alpha(): number {
    if (this.progress < 0) return 0;
    const pct = this.progress / this.maxRadius;
    return Math.max(0, 1 - pct * 0.8);
  }

  get radius(): number {
    return Math.max(0, this.progress);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.radius <= 0 || this.alpha <= 0) return;
    ctx.strokeStyle = `rgba(255, 215, 0, ${this.alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // 内圈
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.alpha * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---- 升级粒子 ----
class Particle2 {
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;

  constructor(
    x: number,
    y: number,
    color: string,
    vx: number,
    vy: number,
    life: number,
    size: number
  ) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = vx;
    this.vy = vy;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.97;
    this.vy *= 0.97;
    this.life--;
    this.size *= 0.98;
  }

  get dead(): boolean {
    return this.life <= 0;
  }

  get alpha(): number {
    return Math.max(0, this.life / this.maxLife);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// ---- 飘字 ----
class FloatingText {
  x: number;
  y: number;
  startY: number;
  level: number;
  life: number;
  maxLife: number;

  constructor(x: number, y: number, level: number) {
    this.x = x;
    this.y = y - 10;
    this.startY = y - 10;
    this.level = level;
    this.maxLife = 75;
    this.life = this.maxLife;
  }

  update(): void {
    this.life--;
    this.y = this.startY - (1 - this.life / this.maxLife) * 60;
  }

  get dead(): boolean {
    return this.life <= 0;
  }

  get alpha(): number {
    if (this.life > this.maxLife * 0.6) return 1;
    return Math.max(0, this.life / (this.maxLife * 0.4));
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 阴影
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText(`★ LEVEL UP! Lv.${this.level} ★`, this.x + 1, this.y + 1);

    // 主文字
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`★ LEVEL UP! Lv.${this.level} ★`, this.x, this.y);

    // 小字
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText('HP↑ 攻击力↑', this.x, this.y + 24);

    ctx.restore();
  }
}
