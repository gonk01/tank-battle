// ============================================================
//  坦克大战 — 粒子特效（爆炸/近战/范围）
// ============================================================

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;

  constructor(
    x: number, y: number, color: string,
    vx: number, vy: number, life: number, size: number
  ) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.life = life; this.maxLife = life;
    this.size = size; this.color = color;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.size *= 0.96;
  }

  get dead(): boolean { return this.life <= 0; }
  get alpha(): number { return Math.max(0, this.life / this.maxLife); }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    ctx.globalAlpha = 1;
  }
}

/** 标准爆炸（坦克摧毁） */
export class Explosion {
  particles: Particle[] = [];

  constructor(x: number, y: number, big = false) {
    const count = big ? 40 : 18;
    const colors = ['#ff6b35', '#ffd700', '#ff4444', '#ffaa00', '#fff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1 + Math.random() * (big ? 3 : 2)) * (big ? 1.5 : 1);
      const life = 15 + Math.floor(Math.random() * (big ? 15 : 10));
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(
        new Particle(
          x + (Math.random() - 0.5) * (big ? 20 : 10),
          y + (Math.random() - 0.5) * (big ? 20 : 10),
          c, Math.cos(angle) * speed, Math.sin(angle) * speed,
          life, big ? 5 : 3
        )
      );
    }
  }

  update(): void { for (const p of this.particles) p.update(); }
  get dead(): boolean { return this.particles.every(p => p.dead); }
  get allDead(): boolean { return this.dead; }
  draw(ctx: CanvasRenderingContext2D): void { for (const p of this.particles) p.draw(ctx); }
}

/** 近战攻击红色冲击波 */
export class MeleeEffect {
  x: number;
  y: number;
  timer: number;
  maxTimer = 12;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.timer = this.maxTimer;
  }

  update(): void { this.timer--; }
  get dead(): boolean { return this.timer <= 0; }

  draw(ctx: CanvasRenderingContext2D): void {
    const progress = 1 - this.timer / this.maxTimer;
    const radius = 15 + progress * 30;
    const alpha = (1 - progress) * 0.6;

    ctx.strokeStyle = `rgba(255, 50, 0, ${alpha})`;
    ctx.lineWidth = 3 - progress * 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    // 内圈
    ctx.strokeStyle = `rgba(255, 150, 50, ${alpha * 0.5})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** 爆炸 AoE 橙色扩散 */
export class ExplosiveEffect {
  x: number;
  y: number;
  radius: number;
  timer: number;
  maxTimer = 15;

  constructor(x: number, y: number, radius: number) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.timer = this.maxTimer;
  }

  update(): void { this.timer--; }
  get dead(): boolean { return this.timer <= 0; }

  draw(ctx: CanvasRenderingContext2D): void {
    const progress = 1 - this.timer / this.maxTimer;
    const r = this.radius * progress;
    const alpha = (1 - progress) * 0.5;

    ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 200, 50, ${alpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}
