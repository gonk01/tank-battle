// ============================================================
//  坦克大战 — 坦克（玩家 & 敌人共用）
// ============================================================

import { Direction } from './types';
import type { GameMap, ThemeConfig, PlayerSkills } from './types';
import {
  TANK_SIZE,
  GAME_W,
  GAME_H,
  PLAYER_INITIAL_HP,
  getSpeedBonus,
} from './constants';
import { Bullet } from './Bullet';
import { rectCollide, collidesWithMap } from './collision';

export class Tank {
  x: number;
  y: number;
  dir: Direction;
  isPlayer: boolean;
  w = TANK_SIZE;
  h = TANK_SIZE;
  alive = true;
  flash = 0;
  cooldown = 0;
  shootDelay: number;

  hp: number;
  maxHp: number;
  attack: number;
  level = 0;

  // 技能（仅玩家）
  skills: PlayerSkills | null = null;

  // 敌人近战
  meleeCooldown = 0;

  aiTimer = 60;
  aiShootTimer = 30 + Math.floor(Math.random() * 40);

  constructor(x: number, y: number, dir: Direction, isPlayer: boolean, level = 0) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.isPlayer = isPlayer;
    this.shootDelay = isPlayer ? 10 : 30;
    this.level = level;

    if (isPlayer) {
      this.maxHp = PLAYER_INITIAL_HP;
      this.hp = PLAYER_INITIAL_HP;
      this.attack = 1;
    } else {
      this.maxHp = 1;
      this.hp = 1;
      this.attack = 1;
    }
  }

  get cx(): number { return this.x + this.w / 2; }
  get cy(): number { return this.y + this.h / 2; }

  get baseSpeed(): number {
    if (!this.isPlayer) return 1.2;
    const base = 2;
    if (!this.skills || this.skills.speed.level === 0) return base;
    return base * getSpeedBonus(this.skills.speed.level);
  }

  move(dir: Direction, map: GameMap, tanks: Tank[]): boolean {
    if (!this.alive) return false;
    this.dir = dir;

    const dx = [0, 1, 0, -1][dir];
    const dy = [-1, 0, 1, 0][dir];
    const speed = this.baseSpeed;
    const newX = this.x + dx * speed;
    const newY = this.y + dy * speed;

    if (newX < 0 || newX > GAME_W - this.w || newY < 0 || newY > GAME_H - this.h)
      return false;

    if (collidesWithMap({ x: newX, y: newY, w: this.w, h: this.h }, map))
      return false;

    for (const t of tanks) {
      if (t === this || !t.alive) continue;
      if (rectCollide({ x: newX, y: newY, w: this.w, h: this.h }, { x: t.x, y: t.y, w: t.w, h: t.h }))
        return false;
    }

    this.x = newX;
    this.y = newY;
    return true;
  }

  canShoot(): boolean {
    return this.cooldown <= 0 && this.alive;
  }

  shoot(bullets: Bullet[]): void {
    if (!this.canShoot()) return;

    const offset = this.w / 2 + 2;
    const baseX = this.cx;
    const baseY = this.cy;
    const dx = [0, 1, 0, -1][this.dir];
    const dy = [-1, 0, 1, 0][this.dir];

    const hasDoubleBarrel = this.isPlayer && this.level >= 2;

    if (hasDoubleBarrel) {
      const perpX = [1, 0, -1, 0][this.dir];
      const perpY = [0, 1, 0, -1][this.dir];
      for (const sign of [-1, 1]) {
        const b = new Bullet(
          baseX + dx * offset + perpX * sign * 4,
          baseY + dy * offset + perpY * sign * 4,
          this.dir,
          this.isPlayer ? 'player' : 'enemy',
          this.attack,
          this.skills
        );
        bullets.push(b);
      }
    } else {
      const b = new Bullet(
        baseX + dx * offset,
        baseY + dy * offset,
        this.dir,
        this.isPlayer ? 'player' : 'enemy',
        this.attack,
        this.skills
      );
      bullets.push(b);
    }

    this.cooldown = this.shootDelay;
  }

  takeDamage(damage: number): boolean {
    // 闪避检查（仅玩家）
    if (this.isPlayer && this.skills) {
      const dodgeLevel = this.skills.dodge.level;
      if (dodgeLevel > 0) {
        const chance = Math.min(50, 8 + (dodgeLevel - 1) * 4);
        if (Math.random() * 100 < chance) {
          this.flash = 5;
          return false; // 闪避成功
        }
      }
    }

    this.hp -= damage;
    if (this.hp <= 0) {
      this.alive = false;
      return true;
    }
    this.flash = 10;
    return false;
  }

  update(): void {
    if (this.cooldown > 0) this.cooldown--;
    if (this.flash > 0) this.flash--;
    if (this.meleeCooldown > 0) this.meleeCooldown--;
  }

  draw(ctx: CanvasRenderingContext2D, frameCount: number, theme: ThemeConfig): void {
    if (!this.alive) return;
    if (this.flash > 0 && Math.floor(this.flash / 3) % 2 === 0) return;

    // 选择主题色
    const colors = this.isPlayer ? {
      body: theme.playerBody,
      turret: theme.playerTurret,
      track: theme.playerTrack,
      highlight: theme.playerHighlight,
    } : {
      body: theme.enemyBody,
      turret: theme.enemyTurret,
      track: theme.enemyTrack,
      highlight: theme.enemyHighlight,
    };

    const cx = this.cx;
    const cy = this.cy;
    const hw = this.w / 2;
    const hh = this.h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.dir * (Math.PI / 2));

    // 敌人红色微光
    if (!this.isPlayer) {
      const glowAlpha = 0.08 + 0.04 * Math.sin(frameCount * 0.05);
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, hw + 4);
      grad.addColorStop(0, `rgba(200,0,0,${glowAlpha})`);
      grad.addColorStop(1, 'rgba(200,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, hw + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 履带
    ctx.fillStyle = colors.track;
    ctx.fillRect(-hw, -hh, this.w, 5);
    ctx.fillRect(-hw, hh - 5, this.w, 5);

    // 履带纹路
    ctx.strokeStyle = this.isPlayer ? '#3a3a5a' : '#3a1a1a';
    ctx.lineWidth = 1;
    for (let i = -hw + 3; i < hw - 2; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, -hh + 1);
      ctx.lineTo(i, -hh + 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(i, hh - 4);
      ctx.lineTo(i, hh - 1);
      ctx.stroke();
    }

    // 主体
    const bodyW = this.w - 8;
    const bodyH = this.h - 8;
    ctx.fillStyle = colors.body;
    ctx.fillRect(-bodyW / 2, -bodyH / 2, bodyW, bodyH);

    ctx.fillStyle = colors.highlight;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(-bodyW / 2 + 2, -bodyH / 2 + 2, bodyW - 4, 3);
    ctx.globalAlpha = 1;

    // 玩家等级条纹
    if (this.isPlayer && this.level >= 1) {
      ctx.fillStyle = colors.highlight;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(-bodyW / 2 + 1, -bodyH / 2 + 6, bodyW - 2, 2);
      ctx.fillRect(-bodyW / 2 + 1, bodyH / 2 - 8, bodyW - 2, 2);
      ctx.globalAlpha = 1;
    }

    // 主题徽标
    this.drawDecal(ctx, theme);

    // 炮塔
    ctx.fillStyle = colors.turret;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.highlight;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // 炮管
    const doubleBarrel = this.isPlayer && this.level >= 2;
    if (doubleBarrel) {
      ctx.fillStyle = colors.turret;
      ctx.fillRect(-4.5, -hh + 2, 3, hh - 4);
      ctx.fillRect(1.5, -hh + 2, 3, hh - 4);
      ctx.fillStyle = '#ddd';
      ctx.fillRect(-4, -hh + 1, 2, 3);
      ctx.fillRect(2, -hh + 1, 2, 3);
    } else {
      ctx.fillStyle = colors.turret;
      ctx.fillRect(-2.5, -hh + 2, 5, hh - 4);
      ctx.fillStyle = '#ddd';
      ctx.fillRect(-2, -hh + 1, 4, 3);
    }

    ctx.restore();
  }

  private drawDecal(ctx: CanvasRenderingContext2D, theme: ThemeConfig): void {
    const decal = this.isPlayer ? theme.playerDecal : theme.enemyDecal;
    ctx.save();

    switch (decal) {
      case 'skull':
        // 骷髅：圆头 + 眼睛 + X 骨
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, -2, 5, 0, Math.PI * 2);
        ctx.stroke();
        // 眼睛
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(-3, -4, 2, 2);
        ctx.fillRect(2, -4, 2, 2);
        // X 骨
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-3, 2);
        ctx.lineTo(3, 6);
        ctx.moveTo(3, 2);
        ctx.lineTo(-3, 6);
        ctx.stroke();
        break;

      case 'star':
        // 白星（二战美军）
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        this.drawStar(ctx, 0, 0, 4, 5);
        break;

      case 'leaf':
        // 叶片
        ctx.fillStyle = 'rgba(100,200,50,0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(2, -1, 3, 2, 0.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'flame':
        // 火焰标记
        ctx.fillStyle = 'rgba(255,100,0,0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.lineTo(-3, -2);
        ctx.lineTo(3, -2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,200,0,0.3)';
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.lineTo(-2, -3);
        ctx.lineTo(2, -3);
        ctx.closePath();
        ctx.fill();
        break;

      case 'cross':
        // 铁十字
        ctx.fillStyle = 'rgba(180,180,180,0.4)';
        ctx.fillRect(-1, -5, 2, 10);
        ctx.fillRect(-5, -1, 10, 2);
        break;

      case 'thorn':
        // 荆棘
        ctx.strokeStyle = 'rgba(80,160,40,0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * 2, Math.sin(angle) * 2);
          ctx.lineTo(Math.cos(angle) * 5, Math.sin(angle) * 5);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle + 0.3) * 3, Math.sin(angle + 0.3) * 3);
          ctx.lineTo(Math.cos(angle + 0.6) * 5, Math.sin(angle + 0.6) * 5);
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  }

  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, points: number): void {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? r : r * 0.4;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}
